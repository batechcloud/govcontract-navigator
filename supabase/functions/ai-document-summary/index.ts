import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT verification
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
    const { documentUrl } = await req.json();
    if (!documentUrl || typeof documentUrl !== "string") {
      return new Response(JSON.stringify({ error: "documentUrl is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SSRF prevention: only allow government domains
    const ALLOWED_SUFFIXES = ['.gov', '.mil'];
    try {
      const parsed = new URL(documentUrl);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Invalid protocol');
      }
      const hostnameAllowed = ALLOWED_SUFFIXES.some(s => parsed.hostname.endsWith(s));
      if (!hostnameAllowed) {
        return new Response(JSON.stringify({ error: "Only .gov and .mil document URLs are allowed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid or disallowed document URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching document:", documentUrl);

    // Fetch the document server-side to avoid CORS
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
    let textContent = "";

    if (contentType.includes("text") || contentType.includes("html") || contentType.includes("xml") || contentType.includes("json")) {
      textContent = await docResponse.text();
    } else {
      // For binary files (PDF, docx, etc.), try to extract readable text
      const buffer = await docResponse.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Try to extract text from binary content
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      // Filter to printable ASCII sequences (rough text extraction)
      const textChunks = decoded.match(/[\x20-\x7E]{20,}/g);
      
      if (textChunks && textChunks.length > 0) {
        textContent = textChunks.join("\n");
      } else {
        return new Response(JSON.stringify({ 
          summary: "This document is in a binary format (PDF, Word, etc.) that cannot be fully parsed for text extraction. Please download the document and review it directly." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Truncate to avoid token limits
    const maxChars = 12000;
    const truncated = textContent.length > maxChars 
      ? textContent.substring(0, maxChars) + "\n...[truncated]" 
      : textContent;

    if (truncated.trim().length < 50) {
      return new Response(JSON.stringify({ 
        summary: "The document appears to be empty or contains insufficient readable text for summarization. Please download and review it directly." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert government contracting analyst. Summarize the following document from a federal contracting opportunity. Your summary should:
1. Identify the document type (SOW, RFP, amendment, Q&A, pricing template, etc.)
2. Summarize key requirements and deliverables
3. Highlight important deadlines and milestones
4. Note eligibility criteria and evaluation factors
5. Call out any set-aside requirements or small business provisions
Keep the summary concise (300-500 words), well-structured with bullet points, and focused on what a small business would need to know to decide whether to bid.`
          },
          {
            role: "user",
            content: `Please summarize this government contract document:\n\n${truncated}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (openaiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (openaiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required. Please check your OpenAI billing." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", openaiResponse.status, await openaiResponse.text());
      return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await openaiResponse.json();
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
