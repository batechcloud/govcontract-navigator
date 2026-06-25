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
      resourceLinks: z.array(z.string().url()).max(10).optional(),
      forceRegenerate: z.boolean().default(false),
    });

    const parsed = SummarySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, agency, description, value, setAside, naicsCode, deadline, type, location, contractId, solicitationNumber, resourceLinks, forceRegenerate } = parsed.data;


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache first (unless force regenerate). Bust legacy cached summaries
    // that pre-date the Requirements / Qualification Criteria sections.
    if (contractId && !forceRegenerate) {
      const { data: cached } = await serviceClient
        .from("contract_summaries")
        .select("summary")
        .eq("contract_id", contractId)
        .maybeSingle();

      if (
        cached?.summary &&
        cached.summary.includes("Requirements") &&
        cached.summary.includes("Qualification Criteria")
      ) {
        return new Response(JSON.stringify({ summary: cached.summary, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Fetch & process attachments (PDFs / HTML / DOC from SAM.gov resourceLinks) ──
    const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB per file
    const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB combined
    const MAX_EXTRACTED_CHARS = 60_000; // total extracted text across attachments
    const ALLOWED_MIMES = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/html",
    ]);

    type Attachment = { filename: string; mime: string; dataUrl: string; scanned?: boolean };
    const attachments: Attachment[] = []; // sent to model as multimodal (e.g. scanned PDFs)
    const extractedTexts: { filename: string; text: string; method: string }[] = [];
    const attachmentNotes: string[] = [];
    let totalBytes = 0;
    let extractedChars = 0;

    // Minimal HTML → text extraction.
    const htmlToText = (html: string): string => {
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<\/?(p|div|br|li|tr|h[1-6])[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    };

    // PDF text extraction via unpdf (Deno-compatible, pure JS).
    const extractPdfText = async (buf: Uint8Array): Promise<string> => {
      const { extractText, getDocumentProxy } = await import(
        "https://esm.sh/unpdf@0.12.1"
      );
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractText(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join("\n\n") : text;
    };

    if (resourceLinks && resourceLinks.length > 0) {
      for (const link of resourceLinks.slice(0, 5)) {
        try {
          const resp = await fetch(link, {
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
          });
          if (!resp.ok) {
            attachmentNotes.push(`- ${link} (fetch failed: HTTP ${resp.status})`);
            continue;
          }
          const mime = (resp.headers.get("content-type") || "application/octet-stream")
            .split(";")[0]
            .trim()
            .toLowerCase();
          if (!ALLOWED_MIMES.has(mime)) {
            attachmentNotes.push(`- ${link} (unsupported type: ${mime})`);
            continue;
          }
          const buf = new Uint8Array(await resp.arrayBuffer());
          if (buf.byteLength > MAX_ATTACHMENT_BYTES) {
            attachmentNotes.push(`- ${link} (too large: ${Math.round(buf.byteLength / 1024 / 1024)}MB)`);
            continue;
          }
          if (totalBytes + buf.byteLength > MAX_TOTAL_BYTES) {
            attachmentNotes.push(`- ${link} (skipped: combined size cap reached)`);
            continue;
          }
          totalBytes += buf.byteLength;
          const filename = decodeURIComponent(link.split("/").pop()?.split("?")[0] || "attachment");

          // Text-first extraction by type.
          let extracted = "";
          let method = "";
          let isScanned = false;

          if (mime === "text/html") {
            const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
            extracted = htmlToText(html);
            method = "html-strip";
          } else if (mime === "text/plain") {
            extracted = new TextDecoder("utf-8", { fatal: false }).decode(buf);
            method = "plaintext";
          } else if (mime === "application/pdf") {
            try {
              extracted = await extractPdfText(buf);
              method = "pdf-text";
              // Heuristic: if very little text relative to file size, treat as scanned.
              const density = extracted.length / Math.max(1, buf.byteLength);
              if (extracted.trim().length < 200 || density < 0.001) {
                isScanned = true;
                method = "pdf-scanned-vision-ocr";
              }
            } catch (e) {
              isScanned = true;
              method = "pdf-extract-failed-vision-ocr";
              console.warn("PDF text extraction failed", filename, e);
            }
          } else {
            // DOC/DOCX — pass to model as file (Gemini handles it natively).
            isScanned = true;
            method = "binary-vision";
          }

          if (extracted && !isScanned) {
            const truncated = extracted.slice(0, MAX_EXTRACTED_CHARS - extractedChars);
            if (truncated.length > 0) {
              extractedTexts.push({ filename, text: truncated, method });
              extractedChars += truncated.length;
            }
            if (truncated.length < extracted.length) {
              attachmentNotes.push(`- ${filename} (truncated to fit ${MAX_EXTRACTED_CHARS} char budget)`);
            }
          } else {
            // Send to model as multimodal file (vision OCR for scanned PDFs, DOCs).
            let binary = "";
            for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
            const b64 = btoa(binary);
            attachments.push({
              filename,
              mime,
              dataUrl: `data:${mime};base64,${b64}`,
              scanned: isScanned,
            });
            if (isScanned) {
              attachmentNotes.push(`- ${filename} (using AI vision OCR — scanned or no extractable text)`);
            }
          }
        } catch (e) {
          attachmentNotes.push(`- ${link} (error: ${e instanceof Error ? e.message : "unknown"})`);
        }
      }
    }

    const extractedBlock = extractedTexts.length > 0
      ? `\n\nExtracted Document Text (verbatim from attachments):\n` +
        extractedTexts
          .map((d) => `\n----- BEGIN ${d.filename} (${d.method}) -----\n${d.text}\n----- END ${d.filename} -----`)
          .join("\n")
      : "";

    const contractContext = [
      title && `Title: ${title}`,
      agency && `Agency: ${agency}`,
      solicitationNumber && `Solicitation Number: ${solicitationNumber}`,
      value && `Estimated Value: ${value}`,
      type && `Contract Type: ${type}`,
      setAside && setAside !== "None" && `Set-Aside: ${setAside}`,
      naicsCode && `NAICS Code: ${naicsCode}`,
      deadline && `Response Deadline: ${deadline}`,
      location && `Place of Performance: ${location}`,
      description && `Full Description / Statement of Work:\n${description}`,
      attachments.length > 0 && `\nAttached Documents sent for vision OCR (${attachments.length}): ${attachments.map(a => a.filename).join(", ")}`,
      extractedBlock,
      attachmentNotes.length > 0 && `\nAttachment processing notes:\n${attachmentNotes.join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n");


    const systemPrompt = `You are a senior government contracting advisor. Your job is to give a 100% accurate, thorough summary of a federal contract opportunity. Use ONLY the facts provided in the listing AND any attached solicitation documents — never guess, infer, or fabricate details. When a detail comes from an attachment, prefer it over the short listing description. If a detail is missing from both, explicitly say "Not specified in the listing."

Write in simple language a non-expert can understand. Use bullet points. Structure your response with these exact markdown headings, in this order:

## 📋 What They're Buying
- Plain-English explanation of exactly what the government needs (goods, services, or both).
- Mention the NAICS code and what industry it maps to.
- Include the solicitation number if provided.

## 📌 Requirements
- Specific deliverables, tasks, and scope of work (pull directly from the SOW / PWS in attachments when available).
- Technical specifications, performance standards, service levels, reporting cadence.
- Security, compliance, or regulatory requirements (e.g., FedRAMP, FISMA, CMMC, HIPAA, Section 508).
- Period of performance, place of performance, and any travel obligations.
- Be specific: cite section numbers or quote short phrases from the attachment when helpful.

## 🎯 Qualification Criteria
- Mandatory eligibility: set-aside type (Small Business, 8(a), WOSB, HUBZone, SDVOSB) and what it means.
- SBA size standard for the NAICS code.
- Required certifications, clearances, licenses, or registrations (e.g., SAM active, CAGE code, GSA schedule, top-secret clearance).
- Past performance requirements (number of similar projects, dollar thresholds, recency).
- Key personnel qualifications (degrees, certifications, years of experience).
- Bonding, insurance, or financial responsibility requirements.

## 💰 Value & Pricing
- Estimated contract value (exact figure if provided).
- Contract type (FFP, T&M, IDIQ, BPA, Cost-Plus) and what it means for pricing risk.
- Whether this is a single award or multiple award.

## 📅 Key Dates & Timeline
- Response/proposal deadline with how many days remain from today.
- Period of performance or contract duration.
- Pre-bid conference, Q&A cutoff, or site-visit dates.

## ✅ Bid / No-Bid Recommendation
- Who this contract is ideal for (company size, capabilities, industry).
- Potential risks or red flags (tight deadline, complex requirements, incumbent advantage).
- Clear bottom-line recommendation for a small business considering this opportunity.

Be thorough but concise — 3-6 bullets per section. Accuracy is paramount: quote specifics from the description and attachments rather than paraphrasing loosely.`;

    // Build multimodal user message
    const userContent: any[] = [
      { type: "text", text: `Summarize this government contract. Read every attached document carefully before writing the Requirements and Qualification Criteria sections.\n\n${contractContext}` },
    ];
    for (const att of attachments) {
      userContent.push({
        type: "file",
        file: { filename: att.filename, file_data: att.dataUrl },
      });
    }

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
          { role: "user", content: userContent },
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

    const processed = {
      extracted: extractedTexts.map((d) => ({ filename: d.filename, method: d.method, chars: d.text.length })),
      visionOcr: attachments.map((a) => ({ filename: a.filename, scanned: !!a.scanned })),
      notes: attachmentNotes,
    };

    return new Response(JSON.stringify({ summary, cached: false, processed }), {
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
