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

  const token = authHeader.replace("Bearer ", "");
  const { data, error: authError } = await supabase.auth.getClaims(token);
  if (authError || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = data.claims.sub as string;

  try {
    const { contract } = await req.json();
    if (!contract?.title) {
      return new Response(JSON.stringify({ error: "Contract title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Fetch company profile
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Fetch win/loss history
    const { data: winLoss } = await supabase
      .from("win_loss_records")
      .select("opportunity_title, outcome, agency")
      .eq("user_id", userId)
      .limit(10);

    const profileContext = profile
      ? `Company: ${profile.company_name}
NAICS: ${profile.naics_codes?.join(", ") || "None"}
Certifications: ${profile.certifications?.join(", ") || "None"}
Capabilities: ${profile.capabilities?.join("; ") || "None"}
Employees: ${profile.employee_count || "N/A"}
Revenue: ${profile.annual_revenue || "N/A"}
Contract Types: ${profile.contract_types?.join(", ") || "N/A"}
Past Performance: ${JSON.stringify(profile.past_performance) || "None"}`
      : "No company profile available.";

    const winLossContext = winLoss && winLoss.length > 0
      ? `Win/Loss History:\n${winLoss.map((r: any) => `- ${r.opportunity_title} (${r.outcome}) at ${r.agency || "N/A"}`).join("\n")}`
      : "";

    const contractContext = `Contract: ${contract.title}
Agency: ${contract.agency || "N/A"}
Value: ${contract.value || "N/A"}
Set-Aside: ${contract.setAside || "None"}
NAICS: ${contract.naicsCode || "N/A"}
Deadline: ${contract.deadline || "N/A"}
Type: ${contract.type || "N/A"}
Description: ${contract.description || "N/A"}`;

    const response = await callOpenAI({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a government contracting analyst. Analyze the contract against the company profile and provide a win probability score. Be realistic and specific.

${profileContext}
${winLossContext}`,
        },
        {
          role: "user",
          content: `Score this contract for win probability:\n\n${contractContext}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "score_contract",
            description: "Return win probability analysis for a government contract",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Win probability 0-100" },
                recommendation: { type: "string", enum: ["Bid", "No-Bid", "Consider"], description: "Bid recommendation" },
                reasoning: { type: "string", description: "2-3 sentence explanation of the score" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 strengths the company has for this contract",
                },
                gaps: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-4 gaps or risks to address",
                },
                tips: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-3 actionable tips to improve chances",
                },
              },
              required: ["score", "recommendation", "reasoning", "strengths", "gaps", "tips"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "score_contract" } },
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
    console.error("contract score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
