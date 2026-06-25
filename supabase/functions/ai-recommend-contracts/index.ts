import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callOpenAI(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  // No internal retry — the client (useAIRecommendations) handles 429 backoff.
  // Keeps total request time bounded and avoids stacked retries.
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function busyFallback(message = "AI picks are temporarily busy. Please refresh in a moment."): Response {
  return jsonResponse({ recommendations: [], message, fallback: true, source: "fallback" });
}

function fallbackFromOpportunities(opportunities: any[]): Response {
  const recommendations = opportunities.slice(0, 5).map((o, i) => ({
    ...o,
    match_reason: "This opportunity matches one of your profile NAICS areas. Review the official listing for fit and deadlines.",
    priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
  }));

  return jsonResponse({
    recommendations,
    message: "AI ranking is temporarily busy, so these are the best matching live opportunities we found.",
    fallback: true,
    source: "sam_fallback",
  });
}

const CACHE_TTL_HOURS = 6;

function sortedOrEmpty(arr: unknown): unknown[] {
  if (!Array.isArray(arr)) return [];
  return [...arr].map((v) => (v == null ? "" : String(v))).sort();
}

async function computeProfileHash(profile: any): Promise<string> {
  const fingerprint = {
    naics: sortedOrEmpty(profile.naics_codes),
    psc: sortedOrEmpty(profile.psc_codes),
    certifications: sortedOrEmpty(profile.certifications),
    capabilities: sortedOrEmpty(profile.capabilities),
    employees: profile.employee_count ?? null,
    revenue: profile.annual_revenue ?? null,
    preferred_agencies: sortedOrEmpty(profile.preferred_agencies),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(fingerprint));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;
  const url = new URL(req.url);
  const bypassCache = url.searchParams.get("fresh") === "1";

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return busyFallback("AI picks are temporarily unavailable. Please try again shortly.");

    // Fetch company profile
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({
        error: "no_profile",
        message: "Complete your company profile to get AI recommendations.",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if profile has NAICS codes at minimum
    const hasNaics = profile.naics_codes && profile.naics_codes.length > 0;
    if (!hasNaics) {
      return new Response(JSON.stringify({
        error: "no_profile",
        message: "Add NAICS codes to your company profile to get personalized recommendations.",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Cache lookup ──
    const profileHash = await computeProfileHash(profile);
    if (!bypassCache) {
      const { data: cached } = await serviceClient
        .from("ai_recommendation_cache")
        .select("payload, profile_hash, expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (
        cached &&
        cached.profile_hash === profileHash &&
        new Date(cached.expires_at).getTime() > Date.now()
      ) {
        return new Response(JSON.stringify(cached.payload), {
          headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "hit" },
        });
      }
    }

    const writeCache = async (payload: Record<string, unknown>) => {
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
      const { error } = await serviceClient
        .from("ai_recommendation_cache")
        .upsert({
          user_id: userId,
          profile_hash: profileHash,
          payload,
          source: (payload as any).source ?? null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        });
      if (error) console.error("cache upsert error:", error);
    };


    const profileContext = `Company: ${profile.company_name}
NAICS: ${profile.naics_codes?.join(", ") || "None"}
PSC Codes: ${profile.psc_codes?.join(", ") || "None"}
Certifications: ${profile.certifications?.join(", ") || "None"}
Capabilities: ${profile.capabilities?.join("; ") || "None"}
Employees: ${profile.employee_count || "N/A"}
Revenue: ${profile.annual_revenue || "N/A"}
Preferred Agencies: ${profile.preferred_agencies?.join(", ") || "Any"}
Set-aside eligibility: ${profile.certifications?.length ? profile.certifications.join(", ") : "Small Business"}`;

    // Try fetching live SAM.gov opportunities
    const samApiKey = Deno.env.get("SAM_API_KEY");
    let opportunities: any[] = [];

    if (samApiKey && hasNaics) {
      try {
        const naicsQuery = profile.naics_codes.slice(0, 3).join(",");
        const samUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${samApiKey}&limit=20&postedFrom=${getDateDaysAgo(30)}&postedTo=${getToday()}&ncode=${naicsQuery}&ptype=o,k`;
        // Hard 4s timeout — if SAM.gov is slow or returns empty, fall through
        // to the AI-generated branch instead of blocking the whole request.
        const samResp = await fetchWithTimeout(samUrl, 4000);
        if (samResp.ok) {
          const samData = await samResp.json();
          opportunities = (samData.opportunitiesData || []).map((o: any) => ({
            id: o.noticeId,
            title: o.title,
            agency: o.fullParentPathName?.split(".")?.pop()?.trim() || o.departmentName || "Unknown",
            value: o.award?.amount ? `$${(o.award.amount / 1000000).toFixed(1)}M` : "Not specified",
            deadline: o.responseDeadLine || null,
            setAside: o.typeOfSetAsideDescription || "None",
            naicsCode: o.naicsCode || null,
            type: o.type || "Solicitation",
            description: (o.description || "").substring(0, 300),
            link: o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
          }));
        }
      } catch (e) {
        console.error("SAM.gov fetch error (non-fatal, falling back to AI generation):", e);
      }
    }

    // ── BRANCH A: Live SAM.gov results found ──
    if (opportunities.length > 0) {
      const opsList = opportunities.map((o, i) => `[${i}] ${o.title} | ${o.agency} | ${o.value} | Set-aside: ${o.setAside} | NAICS: ${o.naicsCode || "N/A"} | Deadline: ${o.deadline || "N/A"}`).join("\n");

      const response = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a government contracting advisor. Given a company profile and a list of opportunities, pick the top 5 best matches and explain why each is a fit. Be specific about NAICS alignment, PSC code relevance, set-aside eligibility, and capability match.\n\n${profileContext}`,
          },
          {
            role: "user",
            content: `Rank the best opportunities for my company:\n\n${opsList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_contracts",
              description: "Return the top 5 recommended contracts",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "Index from the opportunity list" },
                        match_reason: { type: "string", description: "One-liner explaining why this is a good fit" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["index", "match_reason", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_contracts" } },
      }, OPENAI_API_KEY);

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI error:", response.status, errText);
        if (response.status === 429 || response.status >= 500) return fallbackFromOpportunities(opportunities);
        throw new Error(`AI error: ${response.status}`);
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

      const { recommendations } = JSON.parse(toolCall.function.arguments);

      const enriched = recommendations
        .filter((r: any) => r.index >= 0 && r.index < opportunities.length)
        .map((r: any) => ({
          ...opportunities[r.index],
          match_reason: r.match_reason,
          priority: r.priority,
        }));

      const payload = { recommendations: enriched, source: "sam_live" };
      await writeCache(payload);
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "miss" },
      });
    }

    // ── BRANCH B: No live SAM.gov results — generate NAICS-based AI picks ──
    console.log("No SAM.gov results, generating NAICS-based recommendations for user:", userId);

    const response = await callOpenAI({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a government contracting advisor helping small businesses find federal opportunities. Based on the company profile below, generate 5 realistic contract opportunity recommendations that would typically appear on SAM.gov for businesses with these NAICS codes, certifications, and capabilities. Make them specific, realistic, and actionable — as if they are real opportunities the business should search for.\n\n${profileContext}`,
        },
        {
          role: "user",
          content: `Generate 5 recommended contract opportunities I should be looking for based on my NAICS codes (${profile.naics_codes.join(", ")}), certifications, and capabilities. Make them realistic federal opportunities with specific agencies, realistic dollar ranges, and set-aside types I'd qualify for.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_recommendations",
            description: "Generate 5 recommended contract opportunities based on NAICS codes",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Realistic contract opportunity title" },
                      agency: { type: "string", description: "Federal agency name" },
                      value: { type: "string", description: "Estimated dollar range, e.g. '$500K - $1M'" },
                      set_aside: { type: "string", description: "Set-aside type the company would qualify for" },
                      naics_code: { type: "string", description: "Primary NAICS code for this opportunity" },
                      match_reason: { type: "string", description: "Why this is a good fit for the company" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      search_tip: { type: "string", description: "Keywords to search on SAM.gov to find similar opportunities" },
                    },
                    required: ["title", "agency", "value", "set_aside", "naics_code", "match_reason", "priority", "search_tip"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_recommendations" } },
    }, OPENAI_API_KEY);

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      if (response.status === 429 || response.status >= 500) return busyFallback();
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

    const { recommendations } = JSON.parse(toolCall.function.arguments);

    const enriched = recommendations.map((r: any, i: number) => ({
      id: `ai-pick-${i}`,
      title: r.title,
      agency: r.agency,
      value: r.value,
      deadline: null,
      setAside: r.set_aside,
      naicsCode: r.naics_code,
      type: "AI Recommendation",
      link: `https://sam.gov/search/?keywords=${encodeURIComponent(r.search_tip)}&sort=-modifiedDate&index=opp&is_active=true`,
      match_reason: r.match_reason,
      priority: r.priority,
      search_tip: r.search_tip,
    }));

    return new Response(JSON.stringify({ recommendations: enriched, source: "ai_generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return busyFallback("AI picks are temporarily unavailable. Please try again shortly.");
  }
});

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function getToday(): string {
  return getDateDaysAgo(0);
}
