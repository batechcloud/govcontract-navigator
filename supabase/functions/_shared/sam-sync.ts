// Shared helpers for SAM.gov sync workers.
// Imported by sam-sync-control to run full + incremental imports.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";
export const PAGE_SIZE = 1000;

const SET_ASIDE_RAW_TO_LABEL: Record<string, string> = {
  SBP: "Small Business",
  SBA: "8(a)",
  SDVOSBC: "SDVOSB",
  VOSBC: "VOSB",
  HZC: "HUBZone",
};

export function formatSamDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function transformToRow(opp: any) {
  const rawDesc = opp.description || opp.synopsis || "";
  const isUrl = typeof rawDesc === "string" && rawDesc.startsWith("http");
  const description = isUrl
    ? `${opp.type || "Federal"} opportunity — ${opp.solicitationNumber || "view on SAM.gov"}`
    : rawDesc;

  const agency = opp.fullParentPathName?.split(".").pop()?.trim()
    || opp.department
    || opp.subtierName
    || opp.officeName
    || "Federal Agency";

  const location = opp.placeOfPerformance?.city?.name
    ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
    : opp.placeOfPerformance?.state?.name || "Various";

  const value = opp.award?.amount || opp.baseAndAllOptionsValue || null;
  const setAside = opp.typeOfSetAside && opp.typeOfSetAside !== "NONE"
    ? (SET_ASIDE_RAW_TO_LABEL[opp.typeOfSetAside] || opp.typeOfSetAside)
    : "Full & Open";

  return {
    contract_id: opp.noticeId || opp.opportunityId || `SAM-${Date.now()}-${Math.random()}`,
    title: opp.title || "Untitled Opportunity",
    agency,
    description,
    location,
    value: value && value > 0 ? value : null,
    deadline: opp.responseDeadLine || null,
    posted_date: opp.postedDate || null,
    naics_code: opp.naics?.[0]?.code || opp.naicsCode || null,
    set_aside: setAside,
    contract_type: opp.type || null,
    source: "SAM.gov",
    url: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}/view` : null),
    match_score: 70,
    resource_links: opp.resourceLinks || [],
    solicitation_number: opp.solicitationNumber || null,
    raw_data: opp,
    fetched_at: new Date().toISOString(),
  };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Fetch one page from SAM.gov with retry/backoff. Returns parsed JSON. */
export async function fetchSamPage(opts: {
  apiKey: string;
  postedFrom: string;
  postedTo: string;
  offset: number;
  limit?: number;
}): Promise<{ ok: true; data: any } | { ok: false; status: number; body: string }> {
  const params = new URLSearchParams();
  params.append("api_key", opts.apiKey);
  params.append("limit", String(opts.limit ?? PAGE_SIZE));
  params.append("offset", String(opts.offset));
  params.append("postedFrom", opts.postedFrom);
  params.append("postedTo", opts.postedTo);

  const url = `${SAM_API_BASE}?${params.toString()}`;
  const backoffs = [1000, 2000, 4000, 8000];
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const resp = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      if (resp.ok) {
        const data = await resp.json();
        return { ok: true, data };
      }
      lastStatus = resp.status;
      lastBody = (await resp.text()).slice(0, 500);
      // Retry on 429 / 5xx
      if (resp.status !== 429 && resp.status < 500) {
        return { ok: false, status: resp.status, body: lastBody };
      }
    } catch (err) {
      lastBody = err instanceof Error ? err.message : String(err);
    }
    if (attempt < backoffs.length) {
      await sleep(backoffs[attempt]);
    }
  }
  return { ok: false, status: lastStatus, body: lastBody };
}

export interface JobUpdates {
  current_offset?: number;
  total_records?: number;
  records_inserted?: number;
  records_updated?: number;
  records_failed?: number;
  status?: string;
  finished_at?: string | null;
  last_error?: string | null;
  checkpoint?: Record<string, unknown>;
  posted_from?: string | null;
  posted_to?: string | null;
}

export async function updateJob(supabase: SupabaseClient, jobId: string, patch: JobUpdates) {
  await supabase.from("sync_jobs").update(patch).eq("id", jobId);
}

export async function isCancelled(supabase: SupabaseClient, jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from("sync_jobs")
    .select("cancel_requested")
    .eq("id", jobId)
    .single();
  return !!data?.cancel_requested;
}

/** Run an import for a single date window. Returns counts. */
export async function runWindow(
  supabase: SupabaseClient,
  jobId: string,
  apiKey: string,
  postedFrom: string,
  postedTo: string,
  startOffset: number,
  counters: { inserted: number; updated: number; failed: number },
): Promise<"done" | "cancelled"> {
  let offset = startOffset;
  let totalForWindow: number | null = null;

  while (true) {
    if (await isCancelled(supabase, jobId)) return "cancelled";

    const result = await fetchSamPage({ apiKey, postedFrom, postedTo, offset });

    if (!result.ok) {
      counters.failed += 1;
      await supabase.from("sync_failed_records").insert({
        job_id: jobId,
        payload: { postedFrom, postedTo, offset, status: result.status, body: result.body },
        error: `SAM page fetch failed (${result.status}): ${result.body.slice(0, 200)}`,
      });
      // Skip this page, keep going.
      offset += PAGE_SIZE;
      if (totalForWindow !== null && offset >= totalForWindow) break;
      // Without a known total, give up after a failed first page to avoid infinite loop.
      if (totalForWindow === null) break;
      continue;
    }

    const data = result.data;
    const opps = data.opportunitiesData || data.data || data.results || [];
    if (totalForWindow === null) {
      totalForWindow = data.totalRecords ?? opps.length;
    }

    if (opps.length === 0) break;

    const rows = opps.map(transformToRow);
    const { error: upsertError, count } = await supabase
      .from("contracts")
      .upsert(rows, { onConflict: "contract_id", count: "exact" });

    if (upsertError) {
      counters.failed += rows.length;
      await supabase.from("sync_failed_records").insert({
        job_id: jobId,
        payload: { postedFrom, postedTo, offset, sample_ids: rows.slice(0, 5).map((r) => r.contract_id) },
        error: `Upsert failed: ${upsertError.message}`,
      });
    } else {
      // We can't easily distinguish insert vs update with upsert; treat as combined.
      counters.inserted += count ?? rows.length;
    }

    offset += rows.length;

    await updateJob(supabase, jobId, {
      current_offset: offset,
      total_records: totalForWindow ?? undefined,
      records_inserted: counters.inserted,
      records_updated: counters.updated,
      records_failed: counters.failed,
      checkpoint: { postedFrom, postedTo, offset },
    });

    if (totalForWindow !== null && offset >= totalForWindow) break;
    if (rows.length < PAGE_SIZE) break;

    // Pacing
    await sleep(400);
  }
  return "done";
}

/** Step a date by N days. */
function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

/** Build descending list of [from,to] windows covering `monthsBack` months. */
export function buildWindows(monthsBack: number, windowDays = 30): Array<{ from: string; to: string }> {
  const windows: Array<{ from: string; to: string }> = [];
  const earliest = new Date();
  earliest.setMonth(earliest.getMonth() - monthsBack);
  let to = new Date();
  while (to > earliest) {
    const from = addDays(to, -windowDays + 1);
    const clampedFrom = from < earliest ? earliest : from;
    windows.push({ from: formatSamDate(clampedFrom), to: formatSamDate(to) });
    to = addDays(clampedFrom, -1);
  }
  return windows;
}

/** Run a full historical import (last 6 months — SAM.gov hard limit). */
export async function runFullImport(supabase: SupabaseClient, jobId: string, apiKey: string) {
  const counters = { inserted: 0, updated: 0, failed: 0 };
  // Resume from checkpoint if present
  const { data: job } = await supabase.from("sync_jobs").select("checkpoint").eq("id", jobId).single();
  const checkpoint = (job?.checkpoint ?? {}) as { window_index?: number; postedFrom?: string; postedTo?: string; offset?: number };

  const windows = buildWindows(6, 30);
  const startWindow = checkpoint.window_index ?? 0;

  for (let i = startWindow; i < windows.length; i++) {
    const w = windows[i];
    const startOffset = (i === startWindow && checkpoint.offset) ? checkpoint.offset : 0;
    await updateJob(supabase, jobId, {
      posted_from: parseSamDate(w.from),
      posted_to: parseSamDate(w.to),
      checkpoint: { window_index: i, postedFrom: w.from, postedTo: w.to, offset: startOffset },
    });
    const outcome = await runWindow(supabase, jobId, apiKey, w.from, w.to, startOffset, counters);
    if (outcome === "cancelled") {
      await updateJob(supabase, jobId, { status: "cancelled", finished_at: new Date().toISOString() });
      return;
    }
  }

  await updateJob(supabase, jobId, {
    status: "completed",
    finished_at: new Date().toISOString(),
    records_inserted: counters.inserted,
    records_failed: counters.failed,
  });

  await supabase
    .from("sync_metadata")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", "sam_sync");
}

function parseSamDate(s: string): string {
  // "MM/DD/YYYY" -> "YYYY-MM-DD"
  const [mm, dd, yyyy] = s.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/** Run an incremental import since the last sync_metadata timestamp. */
export async function runIncrementalImport(supabase: SupabaseClient, jobId: string, apiKey: string) {
  const counters = { inserted: 0, updated: 0, failed: 0 };

  const { data: meta } = await supabase
    .from("sync_metadata")
    .select("last_synced_at")
    .eq("id", "sam_sync")
    .single();

  const since = meta?.last_synced_at ? new Date(meta.last_synced_at) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const postedFrom = formatSamDate(since);
  const postedTo = formatSamDate(new Date());

  await updateJob(supabase, jobId, {
    posted_from: parseSamDate(postedFrom),
    posted_to: parseSamDate(postedTo),
    checkpoint: { postedFrom, postedTo, offset: 0 },
  });

  const outcome = await runWindow(supabase, jobId, apiKey, postedFrom, postedTo, 0, counters);

  await updateJob(supabase, jobId, {
    status: outcome === "cancelled" ? "cancelled" : "completed",
    finished_at: new Date().toISOString(),
    records_inserted: counters.inserted,
    records_failed: counters.failed,
  });

  if (outcome !== "cancelled") {
    await supabase
      .from("sync_metadata")
      .update({
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", "sam_sync");
  }
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
