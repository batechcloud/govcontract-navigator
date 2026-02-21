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

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({
        score: 0,
        suggestions: [
          { title: "Create your company profile", description: "Set up your company name, NAICS codes, and certifications to get started.", priority: "high" },
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileData = `Company Name: ${profile.company_name}
NAICS Codes: ${profile.naics_codes?.length || 0} codes (${profile.naics_codes?.join(", ") || "none"})
Certifications: ${profile.certifications?.length || 0} (${profile.certifications?.join(", ") || "none"})
Capabilities: ${profile.capabilities?.length || 0} listed
SAM UEI: ${profile.sam_uei || "Not set"}
CAGE Code: ${profile.cage_code || "Not set"}
DUNS (deprecated - replaced by SAM UEI): ${profile.duns_number || "Not set"}
Employees: ${profile.employee_count || "Not set"}
Revenue: ${profile.annual_revenue || "Not set"}
Year Founded: ${profile.year_founded || "Not set"}
Past Performance: ${Array.isArray(profile.past_performance) ? profile.past_performance.length : 0} entries
Preferred Agencies: ${profile.preferred_agencies?.length || 0}
Contract Types: ${profile.contract_types?.length || 0}`;

    const response = await callOpenAI({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a government contracting advisor. Analyze this company profile for completeness and readiness to win federal contracts. Score it 0-100 and give specific, actionable suggestions. IMPORTANT: Do NOT suggest registering a DUNS number — DUNS numbers are deprecated and replaced by SAM UEI. Focus on SAM UEI, CAGE code, NAICS codes, certifications, capabilities, and past performance instead.",
        },
        {
          role: "user",
          content: `Analyze this profile:\n\n${profileData}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_profile",
            description: "Return profile health score and suggestions",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Profile health score 0-100" },
                summary: { type: "string", description: "One sentence summary of the profile's readiness" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short actionable title" },
                      description: { type: "string", description: "Specific guidance on what to do" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["score", "summary", "suggestions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "analyze_profile" } },
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

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("profile optimizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
