// Shared helpers for SAM.gov sync workers.
// Imported by sam-sync-control to run full + incremental imports.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";
export const PAGE_SIZE = 1000;

// Maps raw SAM.gov set-aside codes to user-facing labels.
// References: https://open.gsa.gov/api/sam-opportunities-api/ (typeOfSetAside).
// SBA = Total Small Business Set-Aside (NOT 8(a) — the old map had this wrong
// and ~15k rows ended up mislabeled). 8(a) is 8A / 8AN / 8AS.
const SET_ASIDE_RAW_TO_LABEL: Record<string, string> = {
  SBA: "Small Business",
  SBP: "Small Business",
  "8A": "8(a)",
  "8AN": "8(a)",
  "8AS": "8(a)",
  SDVOSBC: "SDVOSB",
  SDVOSBS: "SDVOSB",
  VOSBC: "VOSB",
  VOSBS: "VOSB",
  WOSB: "WOSB",
  WOSBSS: "WOSB",
  EDWOSB: "EDWOSB",
  EDWOSBSS: "EDWOSB",
  HZC: "HUBZone",
  HZS: "HUBZone",
  IEE: "Indian Economic Enterprise",
  ISBEE: "Indian Small Business",
};

// SAM occasionally returns typeOfSetAside as an array — pulling [0] yields the
// real code. Without this, JSON.stringify leaks values like `["SBA"]` into the
// set_aside column.
function normalizeSetAside(raw: unknown): string {
  let code: string | null = null;
  if (Array.isArray(raw)) {
    code = typeof raw[0] === "string" ? raw[0] : null;
  } else if (typeof raw === "string") {
    code = raw;
  }
  if (!code || code === "NONE") return "Full & Open";
  return SET_ASIDE_RAW_TO_LABEL[code] ?? code;
}

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

  const pathSegments: string[] = typeof opp.fullParentPathName === "string"
    ? opp.fullParentPathName.split(".").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const agency = pathSegments[pathSegments.length - 1]
    || opp.department
    || opp.subtierName
    || opp.officeName
    || "Federal Agency";
  const parentAgency = pathSegments[0] || opp.department || null;

  const location = opp.placeOfPerformance?.city?.name
    ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
    : opp.placeOfPerformance?.state?.name || "Various";

  const value = opp.award?.amount || opp.baseAndAllOptionsValue || null;
  const setAside = normalizeSetAside(opp.typeOfSetAside);

  return {
    contract_id: opp.noticeId || opp.opportunityId || `SAM-${Date.now()}-${Math.random()}`,
    title: opp.title || "Untitled Opportunity",
    agency,
    parent_agency: parentAgency,
    description,
    location,
    value: value && value > 0 ? value : null,
    deadline: opp.responseDeadLine || null,
    posted_date: opp.postedDate || null,
    naics_code: opp.naics?.[0]?.code || opp.naicsCode || null,
    psc_code: typeof opp.classificationCode === "string"
      ? opp.classificationCode.trim() || null
      : null,
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
  /** When true, append `active=true` (matches the cron's filter). */
  activeOnly?: boolean;
}): Promise<{ ok: true; data: any } | { ok: false; status: number; body: string }> {
  const params = new URLSearchParams();
  params.append("api_key", opts.apiKey);
  params.append("limit", String(opts.limit ?? PAGE_SIZE));
  params.append("offset", String(opts.offset));
  params.append("postedFrom", opts.postedFrom);
  params.append("postedTo", opts.postedTo);
  // SAM.gov's /opportunities/v2/search returns an empty `opportunitiesData`
  // array for many wide windows unless an `active` filter is present. The
  // cron at sam-sync-incremental has always sent `active=true` and works;
  // runWindow used to omit it, which is why full backfills silently
  // produced 0 rows for 5 of 6 windows. Default to true here so both code
  // paths behave the same; callers can override for archive sweeps.
  if (opts.activeOnly !== false) {
    params.append("active", "true");
  }

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

/**
 * Run an import for a single date window.
 *
 * windowIndex (optional) is preserved into the checkpoint on every page so
 * a partial run can be resumed from the correct window when runFullImport
 * is re-invoked. Without this, page-level updates would overwrite the
 * window_index that runFullImport set at the start of the window, and a
 * resume would always restart from window 0.
 */
export async function runWindow(
  supabase: SupabaseClient,
  jobId: string,
  apiKey: string,
  postedFrom: string,
  postedTo: string,
  startOffset: number,
  counters: { inserted: number; updated: number; failed: number },
  windowIndex?: number,
): Promise<{ outcome: "done" | "cancelled"; inserted: number; totalRecords: number | null; pages: number; failedPages: number }> {
  let offset = startOffset;
  let totalForWindow: number | null = null;
  let windowInserted = 0;
  let windowFailedPages = 0;
  let pages = 0;
  const label = `[window ${windowIndex ?? "?"}] ${postedFrom}->${postedTo}`;

  while (true) {
    if (await isCancelled(supabase, jobId)) {
      return { outcome: "cancelled", inserted: windowInserted, totalRecords: totalForWindow, pages, failedPages: windowFailedPages };
    }

    const result = await fetchSamPage({ apiKey, postedFrom, postedTo, offset });
    pages += 1;

    if (!result.ok) {
      console.error(`${label} page offset=${offset} FAILED (${result.status}): ${result.body.slice(0, 200)}`);
      counters.failed += 1;
      windowFailedPages += 1;
      await supabase.from("sync_failed_records").insert({
        job_id: jobId,
        payload: { postedFrom, postedTo, offset, status: result.status, body: result.body, window_index: windowIndex },
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
      console.log(`${label} totalRecords=${totalForWindow} (first page returned ${opps.length})`);
    }

    if (opps.length === 0) {
      console.log(`${label} page offset=${offset} returned 0 opportunities; ending window`);
      break;
    }

    const rows = opps.map(transformToRow);
    const { error: upsertError } = await supabase
      .from("contracts")
      .upsert(rows, { onConflict: "contract_id" });

    if (upsertError) {
      console.error(`${label} upsert error at offset=${offset}: ${upsertError.message}`);
      counters.failed += rows.length;
      windowFailedPages += 1;
      await supabase.from("sync_failed_records").insert({
        job_id: jobId,
        payload: { postedFrom, postedTo, offset, sample_ids: rows.slice(0, 5).map((r) => r.contract_id), window_index: windowIndex },
        error: `Upsert failed: ${upsertError.message}`,
      });
    } else {
      counters.inserted += rows.length;
      windowInserted += rows.length;
    }

    offset += rows.length;

    await updateJob(supabase, jobId, {
      current_offset: offset,
      total_records: totalForWindow ?? undefined,
      records_inserted: counters.inserted,
      records_updated: counters.updated,
      records_failed: counters.failed,
      checkpoint: windowIndex !== undefined
        ? { window_index: windowIndex, postedFrom, postedTo, offset }
        : { postedFrom, postedTo, offset },
    });

    if (totalForWindow !== null && offset >= totalForWindow) break;
    if (rows.length < PAGE_SIZE) break;

    // Pacing
    await sleep(400);
  }
  console.log(`${label} done: inserted=${windowInserted} pages=${pages} failedPages=${windowFailedPages} totalRecords=${totalForWindow}`);
  return { outcome: "done", inserted: windowInserted, totalRecords: totalForWindow, pages, failedPages: windowFailedPages };
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
    // Pass `i` so runWindow's per-page checkpoint updates preserve the
    // window_index — required for resume-after-crash to advance instead of
    // restarting from window 0.
    const outcome = await runWindow(supabase, jobId, apiKey, w.from, w.to, startOffset, counters, i);
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
