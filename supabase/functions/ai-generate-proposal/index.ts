import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // user is already available from getUser() above

    const ProposalSchema = z.object({
      opportunityId: z.string().max(200).optional(),
      opportunityTitle: z.string().min(1, "Opportunity title is required").max(500),
      agency: z.string().max(300).optional(),
      customInstructions: z.string().max(5000).optional(),
    });

    const parsed = ProposalSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { opportunityId, opportunityTitle, agency, customInstructions } = parsed.data;

    // Fetch company profile
    const { data: companyProfile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch user documents metadata (for context)
    const { data: userDocs } = await supabase
      .from("user_documents")
      .select("file_name, category, file_size")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch past proposals for style reference
    const { data: pastProposals } = await supabase
      .from("proposals")
      .select("opportunity_title, executive_summary, status")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch win/loss records for insights
    const { data: winLossRecords } = await supabase
      .from("win_loss_records")
      .select("opportunity_title, outcome, lessons_learned, agency")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Build rich context for the AI
    const companyContext = companyProfile
      ? `
COMPANY PROFILE:
- Company Name: ${companyProfile.company_name}
- Year Founded: ${companyProfile.year_founded || "N/A"}
- Employees: ${companyProfile.employee_count || "N/A"}
- Annual Revenue: ${companyProfile.annual_revenue || "N/A"}
- SAM UEI: ${companyProfile.sam_uei || "N/A"}
- CAGE Code: ${companyProfile.cage_code || "N/A"}
- NAICS Codes: ${companyProfile.naics_codes?.join(", ") || "N/A"}
- Certifications: ${companyProfile.certifications?.join(", ") || "N/A"}
- Capabilities: ${companyProfile.capabilities?.join("; ") || "N/A"}
- Preferred Agencies: ${companyProfile.preferred_agencies?.join(", ") || "N/A"}
- Past Performance: ${JSON.stringify(companyProfile.past_performance) || "N/A"}
`
      : "No company profile found. Generate generic content.";

    const docsContext = userDocs && userDocs.length > 0
      ? `\nAVAILABLE DOCUMENTS:\n${userDocs.map((d: any) => `- ${d.file_name} (${d.category})`).join("\n")}`
      : "";

    const pastProposalContext = pastProposals && pastProposals.length > 0
      ? `\nPAST SUBMITTED PROPOSALS:\n${pastProposals.map((p: any) => `- ${p.opportunity_title}: ${p.executive_summary?.substring(0, 200) || "No summary"}`).join("\n")}`
      : "";

    const winLossContext = winLossRecords && winLossRecords.length > 0
      ? `\nWIN/LOSS HISTORY:\n${winLossRecords.map((r: any) => `- ${r.opportunity_title} (${r.outcome}) at ${r.agency || "Unknown agency"}${r.lessons_learned ? ` — Lessons: ${r.lessons_learned.substring(0, 150)}` : ""}`).join("\n")}`
      : "";

    const systemPrompt = `You are an expert government contract proposal writer with deep knowledge of FAR (Federal Acquisition Regulation), government procurement, and winning bid strategies.

Your job is to generate a complete, professional, and compelling government contract proposal based on the company's profile, past performance, and the target opportunity.

${companyContext}
${docsContext}
${pastProposalContext}
${winLossContext}

INSTRUCTIONS:
- Write in a professional, confident tone appropriate for government proposals
- Use specific details from the company profile to demonstrate qualifications
- Reference certifications and past performance where relevant
- Follow standard government proposal structure
- Be specific and avoid generic filler language
- If the company has set-aside certifications (8(a), HUBZone, SDVOSB, WOSB), highlight them prominently
- Include compliance language and FAR references where appropriate
${customInstructions ? `\nADDITIONAL INSTRUCTIONS FROM USER:\n${customInstructions}` : ""}

Generate the proposal in the following JSON structure using the tool provided. Each section should be detailed (minimum 3-4 paragraphs each). Make it compelling and specific to the company's strengths.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

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
          {
            role: "user",
            content: `Generate a complete proposal for: "${opportunityTitle}"${opportunityId ? ` (Opportunity ID: ${opportunityId})` : ""}${agency ? ` from ${agency}` : ""}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_proposal",
              description: "Generate a structured government contract proposal",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "Executive summary highlighting company qualifications, understanding of requirements, and value proposition. 3-4 paragraphs.",
                  },
                  technical_approach: {
                    type: "string",
                    description: "Detailed technical approach describing methodology, tools, processes, and how the company will deliver. 4-5 paragraphs.",
                  },
                  management_plan: {
                    type: "string",
                    description: "Management plan covering team structure, quality assurance, communication, risk mitigation, and project management approach. 3-4 paragraphs.",
                  },
                  past_performance: {
                    type: "string",
                    description: "Past performance section highlighting relevant contracts, outcomes, and client satisfaction. Reference specific company data. 2-3 paragraphs.",
                  },
                  pricing_notes: {
                    type: "string",
                    description: "Pricing strategy notes and recommendations for competitive positioning. 1-2 paragraphs.",
                  },
                  match_score: {
                    type: "number",
                    description: "Estimated match score 0-100 based on how well the company fits this opportunity.",
                  },
                },
                required: ["executive_summary", "technical_approach", "management_plan", "past_performance", "pricing_notes", "match_score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_proposal" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured proposal data");
    }

    const proposal = JSON.parse(toolCall.function.arguments);

    // Save to database
    const { data: savedProposal, error: saveError } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        opportunity_id: opportunityId || `custom-${Date.now()}`,
        opportunity_title: opportunityTitle,
        agency: agency || null,
        executive_summary: proposal.executive_summary,
        technical_approach: proposal.technical_approach,
        management_plan: proposal.management_plan,
        past_performance: proposal.past_performance,
        pricing_notes: proposal.pricing_notes,
        match_score: proposal.match_score,
        status: "draft",
        ai_generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save proposal");
    }

    return new Response(
      JSON.stringify({ proposal: savedProposal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Proposal generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
