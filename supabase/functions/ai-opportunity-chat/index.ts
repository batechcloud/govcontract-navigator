import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const ChatSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(10000),
      })).min(1).max(50),
      companyContext: z.object({
        company_name: z.string().max(200).optional(),
        capabilities: z.array(z.string().max(200)).optional(),
        certifications: z.array(z.string().max(100)).optional(),
        naics_codes: z.array(z.string().max(10)).optional(),
        employee_count: z.string().max(50).optional(),
        annual_revenue: z.string().max(50).optional(),
      }).nullable().optional(),
    });

    const parsed = ChatSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, companyContext } = parsed.data;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI is busy, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
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
