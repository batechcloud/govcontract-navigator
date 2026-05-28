// Nightly SAM.gov sync. Called by nightly-sync-dispatch (and admin-run-sync).
// Reads sync_cursors.sam, pages SAM.gov, upserts into sam_opportunities,
// writes a sync_runs row, advances the cursor on success.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";
const PAGE_SIZE = 1000;
// SAM.gov hard-caps postedFrom at ~6 months. Use 180 days as the safe ceiling.
const MAX_LOOKBACK_DAYS = 180;
// Edge runtime wall-clock budget — bail before hitting the platform limit.
const WALL_TIME_BUDGET_MS = 240_000;

function fmt(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

const SET_ASIDE_MAP: Record<string, string> = {
  SBA: "Small Business",
  SBP: "Small Business",
  "8A": "8(a)", "8AN": "8(a)", "8AS": "8(a)",
  SDVOSBC: "SDVOSB", SDVOSBS: "SDVOSB",
  VOSBC: "VOSB", VOSBS: "VOSB",
  WOSB: "WOSB", WOSBSS: "WOSB",
  EDWOSB: "EDWOSB", EDWOSBSS: "EDWOSB",
  HZC: "HUBZone", HZS: "HUBZone",
  IEE: "Indian Economic Enterprise",
  ISBEE: "Indian Small Business",
};
function normalizeSetAside(raw: unknown): string {
  let code: string | null = null;
  if (Array.isArray(raw)) code = typeof raw[0] === "string" ? raw[0] : null;
  else if (typeof raw === "string") code = raw;
  if (!code || code === "NONE") return "Full & Open";
  return SET_ASIDE_MAP[code] ?? code;
}

function transformRow(opp: any) {
  const rawDesc = opp.description || opp.synopsis || "";
  const isUrl = typeof rawDesc === "string" && rawDesc.startsWith("http");
  const description = isUrl
    ? `${opp.type || "Federal"} opportunity — ${opp.solicitationNumber || "view on SAM.gov"}`
    : rawDesc;
  const pathSegments: string[] = typeof opp.fullParentPathName === "string"
    ? opp.fullParentPathName.split(".").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const agency = pathSegments[pathSegments.length - 1]
    || opp.department || opp.subtierName || opp.officeName || "Federal Agency";
  const parentAgency = pathSegments[0] || opp.department || null;
  const location = opp.placeOfPerformance?.city?.name
    ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
    : opp.placeOfPerformance?.state?.name || "Various";
  const value = opp.award?.amount || opp.baseAndAllOptionsValue || null;
  return {
    notice_id: (opp.noticeId || opp.opportunityId || "").toLowerCase() || `sam-${Date.now()}-${Math.random()}`,
    title: opp.title || "Untitled Opportunity",
    agency,
    parent_agency: parentAgency,
    sub_agency: opp.subtierName || null,
    office: opp.officeName || null,
    description,
    location,
    value: value && value > 0 ? value : null,
    deadline: opp.responseDeadLine || null,
    posted_date: opp.postedDate || null,
    naics_code: opp.naics?.[0]?.code || opp.naicsCode || null,
    psc_code: typeof opp.classificationCode === "string" ? opp.classificationCode.trim() || null : null,
    set_aside: normalizeSetAside(opp.typeOfSetAside),
    contract_type: opp.type || null,
    url: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}/view` : null),
    match_score: 70,
    resource_links: opp.resourceLinks || [],
    solicitation_number: opp.solicitationNumber || null,
    raw: opp,
    synced_at: new Date().toISOString(),
  };
}

async function sleep(ms: number) { await new Promise((r) => setTimeout(r, ms)); }

async function fetchPage(apiKey: string, postedFrom: string, postedTo: string, offset: number) {
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(PAGE_SIZE),
    offset: String(offset),
    postedFrom, postedTo,
    active: "true",
  });
  const backoffs = [1000, 2000, 4000, 8000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const resp = await fetch(`${SAM_API_BASE}?${params}`, { headers: { Accept: "application/json" } });
      if (resp.ok) return { ok: true as const, data: await resp.json() };
      const body = (await resp.text()).slice(0, 300);
      if (resp.status !== 429 && resp.status < 500) return { ok: false as const, status: resp.status, body };
    } catch (err) {
      if (attempt === backoffs.length) return { ok: false as const, status: 0, body: String(err) };
    }
    if (attempt < backoffs.length) await sleep(backoffs[attempt]);
  }
  return { ok: false as const, status: 0, body: "exhausted retries" };
}

async function runSync(supabase: SupabaseClient, runId: string, manual: boolean) {
  const deadline = Date.now() + WALL_TIME_BUDGET_MS;
  const apiKey = Deno.env.get("SAM_API_KEY");
  if (!apiKey) throw new Error("SAM_API_KEY not configured");

  // Cursor: last sync time, or default to 180 days ago.
  const { data: cursor } = await supabase
    .from("sync_cursors").select("last_synced_at").eq("source", "sam").maybeSingle();
  const since = cursor?.last_synced_at
    ? new Date(cursor.last_synced_at)
    : new Date(Date.now() - MAX_LOOKBACK_DAYS * 86_400_000);
  // Cap at MAX_LOOKBACK_DAYS even if the cursor is older.
  const minSince = new Date(Date.now() - MAX_LOOKBACK_DAYS * 86_400_000);
  const effectiveSince = since < minSince ? minSince : since;
  const now = new Date();
  const postedFrom = fmt(effectiveSince);
  const postedTo = fmt(now);

  await supabase.from("sync_runs").update({
    window_from: effectiveSince.toISOString(),
    window_to: now.toISOString(),
  }).eq("id", runId);

  let offset = 0;
  let pages = 0;
  let fetched = 0;
  let inserted = 0;
  let total: number | null = null;
  let cancelled = false;

  while (true) {
    if (Date.now() > deadline) {
      console.log(`SAM sync hit wall-time at offset=${offset}`);
      break;
    }
    // Cooperative cancellation check
    const { data: rrow } = await supabase
      .from("sync_runs").select("cancel_requested").eq("id", runId).maybeSingle();
    if (rrow?.cancel_requested) {
      console.log(`SAM sync cancel requested at offset=${offset}`);
      cancelled = true;
      break;
    }
    const res = await fetchPage(apiKey, postedFrom, postedTo, offset);
    pages++;
    if (!res.ok) {
      throw new Error(`SAM page fetch failed (${res.status}): ${res.body}`);
    }
    const opps = res.data.opportunitiesData || res.data.data || [];
    if (total === null) total = res.data.totalRecords ?? opps.length;
    if (opps.length === 0) break;

    const rows = opps.map(transformRow);
    const { error: upErr } = await supabase
      .from("sam_opportunities")
      .upsert(rows, { onConflict: "notice_id" });
    if (upErr) throw new Error(`Upsert failed: ${upErr.message}`);

    fetched += opps.length;
    inserted += rows.length;
    offset += opps.length;

    await supabase.from("sync_runs").update({
      records_fetched: fetched, records_inserted: inserted, pages,
    }).eq("id", runId);

    if (opps.length < PAGE_SIZE) break;
    if (total !== null && offset >= total) break;
    await sleep(300);
  }

  return { fetched, inserted, pages, window_from: effectiveSince, window_to: now, cancelled };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { manual?: boolean; triggered_by?: string } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }

  // Create run row
  const { data: run, error: runErr } = await supabase
    .from("sync_runs")
    .insert({
      source: "sam",
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
    const result = await runSync(supabase, run.id, !!body.manual);
    await supabase.from("sync_runs").update({
      status: result.cancelled ? "cancelled" : "success",
      finished_at: new Date().toISOString(),
      records_fetched: result.fetched,
      records_inserted: result.inserted,
      pages: result.pages,
    }).eq("id", run.id);
    if (!result.cancelled) {
      await supabase.from("sync_cursors").upsert({
        source: "sam",
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
