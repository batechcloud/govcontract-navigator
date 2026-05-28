// Nightly USASpending.gov sync. Pages /api/v2/search/spending_by_award/
// filtered by date_signed since last cursor. Upserts into usaspending_awards.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const USA_BASE = "https://api.usaspending.gov/api/v2";
const PAGE_SIZE = 100;
// Baseline: 12 months on first run.
const BASELINE_DAYS = 365;
const WALL_TIME_BUDGET_MS = 240_000;

const AWARD_FIELDS = [
  "Award ID",
  "generated_internal_id",
  "Recipient Name",
  "recipient_id",
  "Award Amount",
  "Total Outlays",
  "Description",
  "Contract Award Type",
  "type_description",
  "Awarding Agency",
  "Awarding Sub Agency",
  "Funding Agency",
  "naics_code",
  "psc_code",
  "Start Date",
  "End Date",
  "Last Modified Date",
  "Place of Performance State Code",
  "Place of Performance City Code",
  "Place of Performance Country Code",
  "type_of_contract_pricing",
  "recipient_uei",
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function transformRow(r: any) {
  return {
    award_id: String(r["Award ID"] || r.generated_internal_id || `usa-${Date.now()}-${Math.random()}`),
    generated_internal_id: r.generated_internal_id || null,
    recipient_name: r["Recipient Name"] || null,
    recipient_uei: r.recipient_uei || null,
    awarding_agency: r["Awarding Agency"] || r.awarding_agency_name || null,
    awarding_sub_agency: r["Awarding Sub Agency"] || r.awarding_sub_agency_name || null,
    funding_agency: r["Funding Agency"] || r.funding_agency_name || null,
    naics_code: r.naics_code ? String(r.naics_code) : null,
    psc_code: r.psc_code ? String(r.psc_code) : null,
    award_type: r["Contract Award Type"] || r.type_description || null,
    award_type_code: r.type || null,
    award_amount: typeof r["Award Amount"] === "number" ? r["Award Amount"] : null,
    base_obligation: typeof r["Total Outlays"] === "number" ? r["Total Outlays"] : null,
    description: r.Description || null,
    date_signed: r["Start Date"] || null,
    period_of_performance_start: r["Start Date"] || null,
    period_of_performance_end: r["End Date"] || null,
    place_of_performance_state:
      r["Place of Performance State Code"] || r.place_of_performance_state_code || null,
    place_of_performance_city:
      r["Place of Performance City Code"] || r.place_of_performance_city_name || null,
    place_of_performance_country:
      r["Place of Performance Country Code"] || r.place_of_performance_country_code || null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}


async function sleep(ms: number) { await new Promise((r) => setTimeout(r, ms)); }

async function fetchPage(startDate: string, endDate: string, page: number) {
  const body = {
    filters: {
      award_type_codes: ["A", "B", "C", "D"],
      time_period: [{ start_date: startDate, end_date: endDate, date_type: "action_date" }],
    },
    fields: AWARD_FIELDS,
    sort: "Award Amount",
    order: "desc",
    limit: PAGE_SIZE,
    page,
  };
  const backoffs = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const resp = await fetch(`${USA_BASE}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) return { ok: true as const, data: await resp.json() };
      const txt = (await resp.text()).slice(0, 300);
      if (resp.status !== 429 && resp.status < 500) return { ok: false as const, status: resp.status, body: txt };
    } catch (err) {
      if (attempt === backoffs.length) return { ok: false as const, status: 0, body: String(err) };
    }
    if (attempt < backoffs.length) await sleep(backoffs[attempt]);
  }
  return { ok: false as const, status: 0, body: "exhausted retries" };
}

async function runSync(supabase: SupabaseClient, runId: string) {
  const deadline = Date.now() + WALL_TIME_BUDGET_MS;
  const { data: cursor } = await supabase
    .from("sync_cursors").select("last_synced_at").eq("source", "usaspending").maybeSingle();
  const since = cursor?.last_synced_at
    ? new Date(cursor.last_synced_at)
    : new Date(Date.now() - BASELINE_DAYS * 86_400_000);
  const now = new Date();
  const startDate = isoDate(since);
  const endDate = isoDate(now);

  await supabase.from("sync_runs").update({
    window_from: since.toISOString(),
    window_to: now.toISOString(),
  }).eq("id", runId);

  let page = 1;
  let fetched = 0;
  let inserted = 0;
  let pages = 0;
  let cancelled = false;

  while (true) {
    if (Date.now() > deadline) {
      console.log(`USASpending sync hit wall-time at page=${page}`);
      break;
    }
    const { data: rrow } = await supabase
      .from("sync_runs").select("cancel_requested").eq("id", runId).maybeSingle();
    if (rrow?.cancel_requested) {
      console.log(`USASpending sync cancel requested at page=${page}`);
      cancelled = true;
      break;
    }
    const res = await fetchPage(startDate, endDate, page);
    pages++;
    if (!res.ok) throw new Error(`USASpending page ${page} failed (${res.status}): ${res.body}`);
    const results = res.data?.results || [];
    if (results.length === 0) break;

    const rows = results.map(transformRow);
    const seen = new Set<string>();
    const uniqueRows = rows.filter((r: any) => {
      if (seen.has(r.award_id)) return false;
      seen.add(r.award_id);
      return true;
    });

    const { error: upErr } = await supabase
      .from("usaspending_awards")
      .upsert(uniqueRows, { onConflict: "award_id" });
    if (upErr) throw new Error(`Upsert failed: ${upErr.message}`);

    fetched += results.length;
    inserted += uniqueRows.length;

    await supabase.from("sync_runs").update({
      records_fetched: fetched, records_inserted: inserted, pages,
    }).eq("id", runId);

    const hasNext = res.data?.page_metadata?.hasNext;
    if (!hasNext) break;
    page++;
    await sleep(250);
  }

  return { fetched, inserted, pages, window_from: since, window_to: now, cancelled };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { manual?: boolean; triggered_by?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const { data: run, error: runErr } = await supabase
    .from("sync_runs")
    .insert({
      source: "usaspending",
      status: "running",
      manual: !!body.manual,
      triggered_by: body.triggered_by ?? null,
    })
    .select("id")
    .single();
  if (runErr || !run) {
    return new Response(JSON.stringify({ error: runErr?.message || "failed to create run" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const result = await runSync(supabase, run.id);
    await supabase.from("sync_runs").update({
      status: result.cancelled ? "cancelled" : "success",
      finished_at: new Date().toISOString(),
      records_fetched: result.fetched,
      records_inserted: result.inserted,
      pages: result.pages,
    }).eq("id", run.id);
    if (!result.cancelled) {
      await supabase.from("sync_cursors").upsert({
        source: "usaspending",
        last_synced_at: result.window_to.toISOString(),
        last_run_id: run.id,
        updated_at: new Date().toISOString(),
      });
    }
    return new Response(JSON.stringify({ ok: true, run_id: run.id, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("sync_runs").update({
      status: "failure",
      finished_at: new Date().toISOString(),
      last_error: msg,
    }).eq("id", run.id);
    return new Response(JSON.stringify({ ok: false, run_id: run.id, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
