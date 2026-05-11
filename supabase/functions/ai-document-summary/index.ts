import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const DocSchema = z.object({
      documentUrl: z.string().min(1).max(2000).url(),
      contractTitle: z.string().max(500).optional(),
      contractAgency: z.string().max(500).optional(),
    });

    const parsed = DocSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentUrl, contractTitle, contractAgency } = parsed.data;

    // SSRF prevention: only allow government domains
    const ALLOWED_SUFFIXES = ['.gov', '.mil'];
    try {
      const urlParsed = new URL(documentUrl);
      if (urlParsed.protocol !== 'https:' && urlParsed.protocol !== 'http:') {
        throw new Error('Invalid protocol');
      }
      const hostnameAllowed = ALLOWED_SUFFIXES.some(s => urlParsed.hostname.endsWith(s));
      if (!hostnameAllowed) {
        return new Response(JSON.stringify({ error: "Only .gov and .mil document URLs are allowed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or disallowed document URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching document:", documentUrl);

    const docResponse = await fetch(documentUrl, {
      headers: { 'Accept': '*/*' },
    });

    if (!docResponse.ok) {
      return new Response(JSON.stringify({ 
        summary: `Unable to fetch document (HTTP ${docResponse.status}). The file may require authentication or may no longer be available.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = docResponse.headers.get("content-type") || "";
    const buffer = await docResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Size check (max ~15MB for base64 payload)
    if (bytes.length > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        summary: "This document is too large for AI analysis (>15MB). Please download and review it directly." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine MIME type for multimodal input
    let mimeType = "application/pdf";
    if (contentType.includes("pdf")) {
      mimeType = "application/pdf";
    } else if (contentType.includes("text") || contentType.includes("html") || contentType.includes("xml")) {
      mimeType = "text/plain";
    } else if (contentType.includes("msword") || contentType.includes("officedocument")) {
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    const contractContext = [
      contractTitle ? `Contract: "${contractTitle}"` : null,
      contractAgency ? `Agency: ${contractAgency}` : null,
    ].filter(Boolean).join(" | ");

    const systemPrompt = `You are a senior government contracting advisor who helps small businesses win federal contracts. Your job is to analyze contract documents with 100% accuracy — ONLY state facts found in the document, never guess or infer.

Your analysis MUST help a small business decide whether to bid and how to win. Structure your response with these exact markdown headings:

## 📄 Document Type & Purpose
Identify exactly what this document is (SOW, RFP, amendment, Q&A, pricing sheet, etc.) and its role in the procurement.

## 📋 Scope of Work & Key Requirements
- List ALL specific deliverables, tasks, and services required
- Include quantities, performance standards, and quality metrics if stated
- Note any technical capabilities or certifications required

## 🏆 Evaluation Criteria & How to Win
- List ALL evaluation factors and their relative importance/weights
- Identify what the agency values most (technical approach, price, past performance, etc.)
- Note any scoring methodology (LPTA, best value tradeoff, etc.)

## 👤 Eligibility & Set-Aside Requirements
- Set-aside type and eligible business categories
- Required certifications, clearances, or registrations
- Any mandatory qualifications or experience thresholds
- NAICS code and size standard

## 💰 Pricing & Contract Structure
- Contract type (FFP, T&M, IDIQ, BPA, etc.)
- Period of performance (base + option years)
- Estimated value or ceiling if stated
- Any pricing constraints or templates required

## 📅 Critical Dates & Deadlines
- Proposal due date and time (with timezone)
- Questions deadline
- Site visit dates if applicable
- Performance start date

## ⚠️ Key Risks & Watch-Outs
- Unusual or burdensome requirements
- Compliance traps that could disqualify a bid
- Insurance, bonding, or financial requirements
- Any red flags for small businesses

## ✅ Bid / No-Bid Recommendation
Give a clear recommendation for a small business considering this opportunity, with specific reasons.

CRITICAL RULES:
- If information is NOT in the document, say "Not specified in this document"
- Use bullet points for every section
- Quote specific numbers, dates, and requirements exactly as written
- Be thorough — missing a key requirement could cost them the contract`;

    const userPrompt = contractContext 
      ? `Analyze this government contract document. ${contractContext}\n\nProvide a comprehensive, accurate summary that will help a small business decide whether to bid and how to win.`
      : `Analyze this government contract document. Provide a comprehensive, accurate summary that will help a small business decide whether to bid and how to win.`;

    // Build messages based on content type
    let messages: any[];

    if (mimeType === "text/plain") {
      // For text content, send as text
      const textContent = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const maxChars = 30000;
      const truncated = textContent.length > maxChars
        ? textContent.substring(0, maxChars) + "\n...[truncated]"
        : textContent;

      if (truncated.trim().length < 50) {
        return new Response(JSON.stringify({ 
          summary: "The document appears to be empty or contains insufficient readable text. Please download and review it directly." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\n--- DOCUMENT CONTENT ---\n${truncated}` },
      ];
    } else {
      // For PDFs and binary docs, validate before sending to the AI gateway.
      // SAM.gov sometimes returns an HTML error page with a PDF content-type,
      // or a 0-page placeholder — both make Gemini error with "document has no pages".
      if (mimeType === "application/pdf") {
        const header = new TextDecoder().decode(bytes.slice(0, 5));
        if (header !== "%PDF-") {
          return new Response(JSON.stringify({
            summary: "This attachment couldn't be opened as a PDF (the source returned an empty or non-PDF file). Please open it directly from SAM.gov.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (bytes.length < 1024) {
          return new Response(JSON.stringify({
            summary: "This attachment appears to be empty or a placeholder. Please open it directly from SAM.gov.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // Chunked base64 encode to avoid stack overflow on large buffers
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const base64 = btoa(binary);

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: documentUrl.split("/").pop() || "document.pdf",
                file_data: `data:${mimeType};base64,${base64}`,
              },
            },
            { type: "text", text: userPrompt },
          ],
        },
      ];
    }

    console.log("Sending to Lovable AI for analysis, content type:", mimeType, "size:", bytes.length);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.2,
        max_tokens: 2500,
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      // Common case: provider rejects the file (e.g. "document has no pages").
      // Return a friendly summary instead of a 500 so the UI stays usable.
      if (/no pages|invalid|unsupported|cannot process/i.test(errText)) {
        return new Response(JSON.stringify({
          summary: "AI couldn't read this attachment (the file may be empty, image-only, or in an unsupported format). Please open it directly from SAM.gov.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "Unable to generate summary.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-document-summary:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
