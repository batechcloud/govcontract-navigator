import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callOpenAI(body: Record<string, unknown>, apiKey: string, maxRetries = 3): Promise<Response> {
  let delay = 1500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.status === 429 && attempt < maxRetries) {
      console.warn(`OpenAI 429 on attempt ${attempt + 1}, retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    return resp;
  }
  throw new Error("OpenAI rate limit exceeded after retries");
}

function validateAndNormalize(raw: unknown): {
  score: number;
  recommendation: "Bid" | "No-Bid" | "Consider";
  reasoning: string;
  strengths: string[];
  gaps: string[];
  tips: string[];
} {
  const data = raw as Record<string, unknown>;

  // Validate and clamp score
  let score = typeof data.score === "number" ? data.score : Number(data.score);
  if (isNaN(score)) score = 50;
  score = Math.round(Math.max(0, Math.min(100, score)));

  // Validate recommendation
  const validRecs = ["Bid", "No-Bid", "Consider"] as const;
  let recommendation: "Bid" | "No-Bid" | "Consider" = "Consider";
  if (typeof data.recommendation === "string") {
    const found = validRecs.find(r => r.toLowerCase() === data.recommendation?.toString().toLowerCase());
    if (found) recommendation = found;
    else {
      // Derive from score if AI returned invalid value
      recommendation = score >= 60 ? "Bid" : score >= 35 ? "Consider" : "No-Bid";
    }
  } else {
    recommendation = score >= 60 ? "Bid" : score >= 35 ? "Consider" : "No-Bid";
  }

  // Validate arrays with fallbacks
  const toStringArray = (val: unknown, fallback: string): string[] => {
    if (Array.isArray(val) && val.length > 0) return val.map(String).slice(0, 5);
    return [fallback];
  };

  return {
    score,
    recommendation,
    reasoning: typeof data.reasoning === "string" && data.reasoning.length > 0
      ? data.reasoning
      : `This contract received a win probability score of ${score}/100.`,
    strengths: toStringArray(data.strengths, "General alignment with contract requirements"),
    gaps: toStringArray(data.gaps, "Additional research needed on specific requirements"),
    tips: toStringArray(data.tips, "Review the full solicitation for detailed requirements"),
  };
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
    const { contract } = await req.json();
    if (!contract?.title) {
      return new Response(JSON.stringify({ error: "Contract title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Fetch company profile and win/loss history in parallel
    const [profileRes, winLossRes] = await Promise.all([
      supabase.from("company_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("win_loss_records").select("opportunity_title, outcome, agency").eq("user_id", userId).limit(10),
    ]);

    const profile = profileRes.data;
    const winLoss = winLossRes.data;

    const profileContext = profile
      ? `Company: ${profile.company_name}
NAICS: ${profile.naics_codes?.join(", ") || "None"}
PSC Codes: ${profile.psc_codes?.join(", ") || "None"}
Certifications: ${profile.certifications?.join(", ") || "None"}
Capabilities: ${profile.capabilities?.join("; ") || "None"}
Employees: ${profile.employee_count || "N/A"}
Revenue: ${profile.annual_revenue || "N/A"}
Contract Types: ${profile.contract_types?.join(", ") || "N/A"}
Past Performance: ${JSON.stringify(profile.past_performance) || "None"}`
      : "No company profile available — score based on contract characteristics only.";

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

    const systemPrompt = `You are a government contracting win-probability analyst. You MUST return a structured score for every contract — never refuse or return empty data.

Scoring guidelines:
- Score 0-100 representing realistic win probability for this specific company.
- If no company profile is available, score based on general small business competitiveness for the contract characteristics (set-asides, value, sector).
- Factor in: NAICS alignment, set-aside eligibility, contract value vs company size, certifications match, past performance relevance, deadline feasibility.
- A set-aside matching the company's certifications adds 15-25 points.
- NAICS code alignment adds 10-20 points.
- Relevant past performance adds 10-15 points.
- Score >= 60: recommend "Bid". Score 35-59: recommend "Consider". Score < 35: recommend "No-Bid".
- Always provide at least 3 strengths, 2 gaps, and 2 tips. Be specific and actionable.

${profileContext}
${winLossContext}`;

    console.log("Scoring contract:", contract.title, "for user:", userId);

    const response = await callOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Score this contract for win probability:\n\n${contractContext}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "score_contract",
            description: "Return win probability analysis for a government contract. You MUST call this function.",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100, description: "Win probability 0-100" },
                recommendation: { type: "string", enum: ["Bid", "No-Bid", "Consider"], description: "Bid recommendation based on score" },
                reasoning: { type: "string", description: "2-3 sentence explanation of the score" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 specific strengths the company has for this contract",
                },
                gaps: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 4,
                  description: "2-4 gaps or risks to address",
                },
                tips: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
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
      const status = response.status;
      const errText = await response.text();
      console.error("OpenAI error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI is busy, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      // Return a fallback score instead of throwing
      return new Response(JSON.stringify(validateAndNormalize({})), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify(validateAndNormalize({})), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = validateAndNormalize(parsed);
    console.log("Score result:", result.score, result.recommendation, "for:", contract.title);

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
