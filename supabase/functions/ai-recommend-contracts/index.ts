import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callOpenAI(body: Record<string, unknown>, apiKey: string, retries = 1): Promise<Response> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (resp.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 2000));
    return callOpenAI(body, apiKey, retries - 1);
  }
  return resp;
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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

    // Fetch recent opportunities from SAM.gov via our edge function
    const samApiKey = Deno.env.get("SAM_API_KEY");
    let opportunities: any[] = [];

    if (samApiKey && profile.naics_codes?.length > 0) {
      try {
        const naicsQuery = profile.naics_codes.slice(0, 3).join(",");
        const samUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${samApiKey}&limit=20&postedFrom=${getDateDaysAgo(30)}&postedTo=${getToday()}&ncode=${naicsQuery}&ptype=o,k`;
        const samResp = await fetch(samUrl);
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
        console.error("SAM.gov fetch error:", e);
      }
    }

    // If no SAM results, provide context-only recommendations
    if (opportunities.length === 0) {
      return new Response(JSON.stringify({
        recommendations: [],
        message: "No live opportunities found matching your NAICS/PSC codes right now. Check back later or broaden your profile.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileContext = `Company: ${profile.company_name}
NAICS: ${profile.naics_codes?.join(", ") || "None"}
PSC Codes: ${profile.psc_codes?.join(", ") || "None"}
Certifications: ${profile.certifications?.join(", ") || "None"}
Capabilities: ${profile.capabilities?.join("; ") || "None"}
Employees: ${profile.employee_count || "N/A"}
Revenue: ${profile.annual_revenue || "N/A"}
Preferred Agencies: ${profile.preferred_agencies?.join(", ") || "Any"}`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI is busy, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

    const { recommendations } = JSON.parse(toolCall.function.arguments);

    // Enrich recommendations with full opportunity data
    const enriched = recommendations
      .filter((r: any) => r.index >= 0 && r.index < opportunities.length)
      .map((r: any) => ({
        ...opportunities[r.index],
        match_reason: r.match_reason,
        priority: r.priority,
      }));

    return new Response(JSON.stringify({ recommendations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
