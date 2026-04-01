import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SummarySchema = z.object({
      title: z.string().max(500).optional(),
      agency: z.string().max(300).optional(),
      description: z.string().max(20000).optional(),
      value: z.string().max(100).optional(),
      setAside: z.string().max(100).optional(),
      naicsCode: z.string().max(10).optional(),
      deadline: z.string().max(50).optional(),
      type: z.string().max(100).optional(),
      location: z.string().max(200).optional(),
      contractId: z.string().max(200).optional(),
      solicitationNumber: z.string().max(200).optional(),
      forceRegenerate: z.boolean().default(false),
    });

    const parsed = SummarySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, agency, description, value, setAside, naicsCode, deadline, type, location, contractId, solicitationNumber, forceRegenerate } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache first (unless force regenerate)
    if (contractId && !forceRegenerate) {
      const { data: cached } = await serviceClient
        .from("contract_summaries")
        .select("summary")
        .eq("contract_id", contractId)
        .maybeSingle();

      if (cached?.summary) {
        return new Response(JSON.stringify({ summary: cached.summary, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const contractContext = [
      title && `Title: ${title}`,
      agency && `Agency: ${agency}`,
      value && `Estimated Value: ${value}`,
      type && `Contract Type: ${type}`,
      setAside && setAside !== "None" && `Set-Aside: ${setAside}`,
      naicsCode && `NAICS Code: ${naicsCode}`,
      deadline && `Response Deadline: ${deadline}`,
      location && `Location: ${location}`,
      description && `Full Description: ${description}`,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a government contracting advisor explaining contracts to someone who has never done government contracting before. Write a clear, concise summary using simple language, short sentences, and bullet points. Structure your response with these exact markdown headings:

## 📋 What They're Buying
Brief plain-English explanation of what this contract is for.

## 📝 What's Required
Key requirements, deliverables, or qualifications needed.

## 👤 Who Can Bid
Eligibility info — set-asides, certifications, size standards.

## 💰 Value & Pricing
Contract value, pricing structure, and financial considerations.

## 📅 Key Dates
Important deadlines and timeline info.

## ✅ Should You Bid?
Honest assessment — who this contract is ideal for, potential risks, and a clear recommendation for small businesses.

Keep each section to 2-4 bullet points max. If information is missing for a section, say "Not specified in the listing" rather than guessing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Summarize this government contract:\n\n${contractContext}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    // Cache the result
    if (contractId) {
      await serviceClient
        .from("contract_summaries")
        .upsert(
          { contract_id: contractId, summary, updated_at: new Date().toISOString() },
          { onConflict: "contract_id" }
        );
    }

    return new Response(JSON.stringify({ summary, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-contract-summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
