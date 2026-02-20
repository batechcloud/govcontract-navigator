import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, companyContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are GC Navigator Helper, a friendly AI assistant that helps small businesses and first-time contractors understand and win government contracts.

You speak in clear, simple language — no jargon unless you explain it. You're encouraging, patient, and practical.

Your expertise includes:
- Searching and understanding SAM.gov opportunities
- Explaining contract requirements in plain English
- Helping with proposal writing strategies
- NAICS codes, set-asides, and certifications
- The government bidding process from start to finish

${companyContext ? `The user's company context:
- Company: ${companyContext.company_name || "Not specified"}
- Capabilities: ${companyContext.capabilities?.join(", ") || "Not specified"}
- Certifications: ${companyContext.certifications?.join(", ") || "None"}
- NAICS Codes: ${companyContext.naics_codes?.join(", ") || "Not specified"}
- Employee Count: ${companyContext.employee_count || "Not specified"}
- Annual Revenue: ${companyContext.annual_revenue || "Not specified"}` : "The user hasn't set up their company profile yet. Encourage them to do so for personalized recommendations."}

Keep answers concise (2-4 paragraphs max). Use bullet points when listing steps. Always be actionable — tell them what to do next.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
