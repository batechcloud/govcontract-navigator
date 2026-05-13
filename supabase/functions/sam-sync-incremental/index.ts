import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";
const MAX_PER_PAGE = 1000;
// Safety cap on pages per run. Daily incremental is ~1-3 pages on a busy
// weekday; the cap is high to survive multi-day gap recoveries (e.g. after a
// cron failure), where postedFrom..postedTo may span several days.
const MAX_PAGES = 50;
// Retry policy for transient SAM.gov failures (504 gateway timeouts and 429
// rate limits are the common modes). Backoff is per-page; the cron has a 60s
// hard ceiling per fetch, so total page time stays bounded.
const FETCH_RETRY_BACKOFFS_MS = [1000, 3000, 8000, 20000];

// Kept in sync with _shared/sam-sync.ts. See that file for the source-of-truth
// mapping and rationale (SBA is Total Small Business, not 8(a); SAM sometimes
// returns typeOfSetAside as an array).
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create a sync_jobs row so the cron run is visible in the admin console.
  // triggered_by is null because the invocation comes from pg_cron, not a user.
  const { data: job } = await supabase
    .from("sync_jobs")
    .insert({
      job_type: "incremental",
      status: "running",
      triggered_by: null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const finishJob = async (
    patch: Record<string, unknown>,
  ) => {
    if (!job) return;
    await supabase
      .from("sync_jobs")
      .update({ ...patch, finished_at: new Date().toISOString() })
      .eq("id", job.id);
  };

  try {
    const SAM_API_KEY = Deno.env.get("SAM_API_KEY");
    if (!SAM_API_KEY) {
      await finishJob({ status: "failed", last_error: "SAM_API_KEY not configured" });
      return new Response(JSON.stringify({ error: "SAM_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get last sync timestamp
    const { data: syncMeta, error: metaError } = await supabase
      .from("sync_metadata")
      .select("*")
      .eq("id", "sam_sync")
      .single();

    if (metaError) {
      console.error("Failed to read sync_metadata:", metaError);
      await finishJob({ status: "failed", last_error: `sync_metadata read: ${metaError.message}` });
      return new Response(JSON.stringify({ error: "Failed to read sync metadata" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lastSyncedAt = new Date(syncMeta.last_synced_at);
    const now = new Date();
    const postedFrom = formatSamDate(lastSyncedAt);
    const postedTo = formatSamDate(now);

    if (job) {
      await supabase
        .from("sync_jobs")
        .update({
          posted_from: parseSamDate(postedFrom),
          posted_to: parseSamDate(postedTo),
          checkpoint: { postedFrom, postedTo, offset: 0 },
        })
        .eq("id", job.id);
    }

    const diagnostics: any[] = [];
    console.log(`Incremental sync: fetching contracts posted from ${postedFrom} to ${postedTo}`);

    let totalSynced = 0;
    let failedPages = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore && offset / MAX_PER_PAGE < MAX_PAGES) {
      const params = new URLSearchParams();
      params.append("api_key", SAM_API_KEY);
      params.append("limit", MAX_PER_PAGE.toString());
      params.append("offset", offset.toString());
      params.append("postedFrom", postedFrom);
      params.append("postedTo", postedTo);
      params.append("active", "true");

      const url = `${SAM_API_BASE}?${params.toString()}`;
      console.log(`Fetching page at offset ${offset}...`);

      // Retry on 5xx and 429. 504 gateway timeouts are common during SAM.gov
      // maintenance windows; without retry, a single transient failure here
      // aborts the whole sync.
      let response: Response | null = null;
      let responseText = "";
      let networkErr: unknown = null;
      for (let attempt = 0; attempt <= FETCH_RETRY_BACKOFFS_MS.length; attempt++) {
        try {
          response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          responseText = await response.text();
          if (response.ok) break;
          // Don't retry 4xx other than 429 — those are deterministic.
          if (response.status !== 429 && response.status < 500) break;
        } catch (err) {
          networkErr = err;
          response = null;
        }
        if (attempt < FETCH_RETRY_BACKOFFS_MS.length) {
          await new Promise(r => setTimeout(r, FETCH_RETRY_BACKOFFS_MS[attempt]));
        }
      }

      if (!response || !response.ok) {
        const status = response?.status ?? 0;
        const body = response ? responseText.substring(0, 500) : (networkErr instanceof Error ? networkErr.message : String(networkErr));
        console.error(`SAM.gov API error at offset ${offset}: ${status}`, body.substring(0, 500));
        diagnostics.push({ offset, status, body: body.substring(0, 200) });
        failedPages += 1;
        if (job) {
          await supabase.from("sync_failed_records").insert({
            job_id: job.id,
            payload: { postedFrom, postedTo, offset, status, body: body.substring(0, 500) },
            error: `SAM page fetch failed (${status})`,
          });
        }
        break;
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse SAM.gov response:", responseText.substring(0, 300));
        diagnostics.push({ offset, error: "parse_error", body: responseText.substring(0, 200) });
        failedPages += 1;
        break;
      }

      console.log(`SAM.gov response keys: ${Object.keys(data).join(", ")}, totalRecords: ${data.totalRecords}`);
      const opportunities = data.opportunitiesData || data.data || data.results || [];
      console.log(`Got ${opportunities.length} opportunities (totalRecords: ${data.totalRecords})`);

      if (opportunities.length === 0) {
        hasMore = false;
        diagnostics.push({ offset, totalRecords: data.totalRecords, keys: Object.keys(data) });
        break;
      }

      // Transform and upsert
      const rows = opportunities.map((opp: any) => transformToRow(opp));

      const { error: upsertError } = await supabase
        .from("contracts")
        .upsert(rows, { onConflict: "contract_id" });

      if (upsertError) {
        console.error(`Upsert error at offset ${offset}:`, upsertError);
        failedPages += 1;
        if (job) {
          await supabase.from("sync_failed_records").insert({
            job_id: job.id,
            payload: { postedFrom, postedTo, offset, sample_ids: rows.slice(0, 5).map((r: any) => r.contract_id) },
            error: `Upsert failed: ${upsertError.message}`,
          });
        }
        break;
      }

      totalSynced += rows.length;
      offset += MAX_PER_PAGE;

      if (job) {
        await supabase
          .from("sync_jobs")
          .update({
            current_offset: offset,
            total_records: data.totalRecords ?? null,
            records_inserted: totalSynced,
            records_failed: failedPages,
            checkpoint: { postedFrom, postedTo, offset },
          })
          .eq("id", job.id);
      }

      if (opportunities.length < MAX_PER_PAGE) {
        hasMore = false;
      }

      // Small delay to respect rate limits
      if (hasMore) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Only advance the cursor if the run actually succeeded. Previously this
    // updated last_synced_at unconditionally — when a fetch failed (e.g. 504),
    // the cursor jumped forward over the un-ingested window and the next cron
    // run never backfilled it. Now: any failed page leaves the cursor where it
    // was, so the next run re-covers the window.
    const advanceCursor = failedPages === 0;
    if (advanceCursor) {
      const { error: updateError } = await supabase
        .from("sync_metadata")
        .update({
          last_synced_at: now.toISOString(),
          total_synced: (syncMeta.total_synced || 0) + totalSynced,
        })
        .eq("id", "sam_sync");

      if (updateError) {
        console.error("Failed to update sync_metadata:", updateError);
      }
    } else {
      console.warn(
        `Cursor NOT advanced: ${failedPages} page(s) failed. ` +
        `Next run will retry window ${postedFrom} -> now.`,
      );
    }

    console.log(`Sync complete: ${totalSynced} contracts synced, ${failedPages} page(s) failed`);

    await finishJob({
      status: failedPages > 0 ? "failed" : "completed",
      records_inserted: totalSynced,
      records_failed: failedPages,
    });

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      from: postedFrom,
      to: postedTo,
      job_id: job?.id ?? null,
      diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    await finishJob({ status: "failed", last_error: message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatSamDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function parseSamDate(s: string): string {
  // "MM/DD/YYYY" -> "YYYY-MM-DD"
  const [mm, dd, yyyy] = s.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function pathSegments(opp: any): string[] {
  if (typeof opp.fullParentPathName !== "string") return [];
  return opp.fullParentPathName.split(".").map((s: string) => s.trim()).filter(Boolean);
}

function extractAgency(opp: any): string {
  const segs = pathSegments(opp);
  return segs[segs.length - 1]
    || opp.department
    || opp.subtierName
    || opp.officeName
    || "Federal Agency";
}

function extractParentAgency(opp: any): string | null {
  const segs = pathSegments(opp);
  return segs[0] || opp.department || null;
}

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

function parseValue(amount: number | null | undefined): number | null {
  if (!amount || amount <= 0) return null;
  return amount;
}

function transformToRow(opp: any) {
  const rawDesc = opp.description || opp.synopsis || "";
  const isUrl = rawDesc.startsWith("http");
  const description = isUrl
    ? `${opp.type || "Federal"} opportunity — ${opp.solicitationNumber || "view on SAM.gov"}`
    : rawDesc;

  return {
    contract_id: opp.noticeId || opp.opportunityId || `SAM-${Date.now()}-${Math.random()}`,
    title: opp.title || "Untitled Opportunity",
    agency: extractAgency(opp),
    parent_agency: extractParentAgency(opp),
    description,
    location: opp.placeOfPerformance?.city?.name
      ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
      : opp.placeOfPerformance?.state?.name || "Various",
    value: parseValue(opp.award?.amount || opp.baseAndAllOptionsValue),
    deadline: opp.responseDeadLine || null,
    posted_date: opp.postedDate || null,
    naics_code: opp.naics?.[0]?.code || opp.naicsCode || null,
    psc_code: typeof opp.classificationCode === "string"
      ? opp.classificationCode.trim() || null
      : null,
    set_aside: normalizeSetAside(opp.typeOfSetAside),
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
