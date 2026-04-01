import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";
const MAX_PER_PAGE = 1000;
const MAX_PAGES = 10; // Safety limit: 10,000 contracts per sync run

const SET_ASIDE_RAW_TO_LABEL: Record<string, string> = {
  SBP: "Small Business",
  SBA: "8(a)",
  SDVOSBC: "SDVOSB",
  VOSBC: "VOSB",
  HZC: "HUBZone",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SAM_API_KEY = Deno.env.get("SAM_API_KEY");
    if (!SAM_API_KEY) {
      return new Response(JSON.stringify({ error: "SAM_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get last sync timestamp
    const { data: syncMeta, error: metaError } = await supabase
      .from("sync_metadata")
      .select("*")
      .eq("id", "sam_sync")
      .single();

    if (metaError) {
      console.error("Failed to read sync_metadata:", metaError);
      return new Response(JSON.stringify({ error: "Failed to read sync metadata" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lastSyncedAt = new Date(syncMeta.last_synced_at);
    const now = new Date();
    const postedFrom = formatSamDate(lastSyncedAt);
    const postedTo = formatSamDate(now);

    const diagnostics: any[] = [];
    console.log(`Incremental sync: fetching contracts posted from ${postedFrom} to ${postedTo}`);

    let totalSynced = 0;
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

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`SAM.gov API error at offset ${offset}: ${response.status}`, responseText.substring(0, 500));
        // Include diagnostic info in response
        diagnostics.push({ offset, status: response.status, body: responseText.substring(0, 200) });
        break;
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse SAM.gov response:", responseText.substring(0, 300));
        diagnostics.push({ offset, error: "parse_error", body: responseText.substring(0, 200) });
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
        break;
      }

      totalSynced += rows.length;
      offset += MAX_PER_PAGE;

      if (opportunities.length < MAX_PER_PAGE) {
        hasMore = false;
      }

      // Small delay to respect rate limits
      if (hasMore) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Update sync metadata
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

    console.log(`Sync complete: ${totalSynced} contracts synced`);

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      from: postedFrom,
      to: postedTo,
      diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
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

function extractAgency(opp: any): string {
  if (opp.fullParentPathName) return opp.fullParentPathName.split(".").pop()?.trim() || opp.fullParentPathName;
  if (opp.department) return opp.department;
  if (opp.subtierName) return opp.subtierName;
  if (opp.officeName) return opp.officeName;
  return "Federal Agency";
}

function normalizeSetAside(raw: string | null | undefined): string {
  if (!raw || raw === "NONE") return "Full & Open";
  return SET_ASIDE_RAW_TO_LABEL[raw] || raw;
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
    description,
    location: opp.placeOfPerformance?.city?.name
      ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
      : opp.placeOfPerformance?.state?.name || "Various",
    value: parseValue(opp.award?.amount || opp.baseAndAllOptionsValue),
    deadline: opp.responseDeadLine || null,
    posted_date: opp.postedDate || null,
    naics_code: opp.naics?.[0]?.code || opp.naicsCode || null,
    set_aside: normalizeSetAside(opp.typeOfSetAside),
    contract_type: opp.type || null,
    source: "SAM.gov",
    url: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}/view` : null),
    match_score: 70, // Base score — can be recalculated per-user later
    resource_links: opp.resourceLinks || [],
    solicitation_number: opp.solicitationNumber || null,
    raw_data: opp,
    fetched_at: new Date().toISOString(),
  };
}
