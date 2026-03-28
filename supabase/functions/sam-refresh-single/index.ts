import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const RefreshSchema = z.object({
      noticeId: z.string().max(200).optional(),
      solicitationNumber: z.string().max(200).optional(),
    }).refine(data => data.noticeId || data.solicitationNumber, {
      message: "noticeId or solicitationNumber required",
    });

    const parsed = RefreshSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { noticeId, solicitationNumber } = parsed.data;

    const SAM_API_KEY = Deno.env.get("SAM_API_KEY");
    if (!SAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SAM API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query for single opportunity
    const params = new URLSearchParams();
    params.append("api_key", SAM_API_KEY);
    params.append("limit", "1");
    params.append("postedFrom", getDateMonthsAgo(24));
    params.append("postedTo", getTodayFormatted());

    if (noticeId) {
      params.append("noticeId", noticeId);
    } else if (solicitationNumber) {
      params.append("solnum", solicitationNumber);
    }

    const url = `${SAM_API_BASE}?${params.toString()}`;
    console.log("Refreshing single contract:", noticeId || solicitationNumber);

    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.error("SAM.gov error:", resp.status);
      return new Response(
        JSON.stringify({ error: "SAM.gov API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    const opps = data.opportunitiesData || data.data || [];

    if (opps.length === 0) {
      return new Response(
        JSON.stringify({ error: "Contract not found on SAM.gov" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const opp = opps[0];
    const result = {
      id: opp.noticeId || opp.opportunityId,
      title: opp.title || "Untitled Opportunity",
      agency: extractAgency(opp),
      type: opp.type || "Solicitation",
      setAside: normalizeSetAside(opp.typeOfSetAside),
      value: formatValue(opp.award?.amount || opp.baseAndAllOptionsValue),
      deadline: opp.responseDeadLine || opp.archiveDate || null,
      postedDate: opp.postedDate || null,
      location: opp.placeOfPerformance?.city?.name
        ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
        : opp.placeOfPerformance?.state?.name || "Various",
      naicsCode: opp.naics?.[0]?.code || opp.naicsCode || "",
      matchScore: 70,
      description: opp.description || opp.synopsis || "",
      solicitationNumber: opp.solicitationNumber || "",
      link: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}/view` : "https://sam.gov"),
      resourceLinks: opp.resourceLinks || [],
    };

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error refreshing contract:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatSamDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return formatSamDate(date);
}

function getTodayFormatted(): string {
  return formatSamDate(new Date());
}

const SET_ASIDE_RAW_TO_LABEL: Record<string, string> = {
  SBP: "Small Business",
  SBA: "8(a)",
  SDVOSBC: "SDVOSB",
  VOSBC: "VOSB",
  HZC: "HUBZone",
};

function normalizeSetAside(raw: string | null | undefined): string {
  if (!raw || raw === "NONE") return "Full & Open";
  return SET_ASIDE_RAW_TO_LABEL[raw] || raw;
}

function extractAgency(opp: any): string {
  if (opp.fullParentPathName) return opp.fullParentPathName.split(".").pop()?.trim() || opp.fullParentPathName;
  if (opp.department) return opp.department;
  if (opp.subtierName) return opp.subtierName;
  return "Federal Agency";
}

function formatValue(amount: number | null | undefined): string {
  if (!amount) return "TBD";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}
