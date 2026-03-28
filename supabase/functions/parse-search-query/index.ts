import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT verification — reject unauthenticated requests
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const QuerySchema = z.object({
      query: z.string().min(1, "Query is required").max(1000),
    });

    const parsed = QuerySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = parsed.data;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      // No API key — use local fallback
      return new Response(
        JSON.stringify({ 
          filters: buildFallbackFilters(query), 
          original_query: query 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Parsing search query:", query);

    // Attempt OpenAI call with one retry on 429
    let aiFilters = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a government contract search query parser. Extract structured filters from natural language queries about government contracts.

Parse the user's query and extract:
- keywords: Main search terms (array of strings)
- naics_codes: NAICS codes mentioned (array of strings like "541512")
- set_aside: Set-aside types like "SDVOSB", "8(a)", "HUBZone", "WOSB", "Small Business" (array)
- agencies: Government agencies mentioned (array)
- min_value: Minimum contract value in dollars (number or null)
- max_value: Maximum contract value in dollars (number or null)
- location: Location/state mentioned (string or null)
- opportunity_type: Type like "Federal", "State", "Grants" (string or null)

Return ONLY a valid JSON object with these fields. If a field is not mentioned, use null for single values or empty array for arrays.`
            },
            { role: "user", content: query }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_search_filters",
                description: "Extract structured search filters from the query",
                parameters: {
                  type: "object",
                  properties: {
                    keywords: { type: "array", items: { type: "string" } },
                    naics_codes: { type: "array", items: { type: "string" } },
                    set_aside: { type: "array", items: { type: "string" } },
                    agencies: { type: "array", items: { type: "string" } },
                    min_value: { type: "number", nullable: true },
                    max_value: { type: "number", nullable: true },
                    location: { type: "string", nullable: true },
                    opportunity_type: { type: "string", nullable: true }
                  },
                  required: ["keywords", "naics_codes", "set_aside", "agencies"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "extract_search_filters" } }
        }),
      });

      if (response.status === 429) {
        console.warn(`OpenAI 429 on attempt ${attempt + 1}, ${attempt === 0 ? "retrying in 2s..." : "falling back to local parser"}`);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        // Second attempt also 429 — fall back to local parsing
        break;
      }

      if (response.status === 402) {
        await response.text();
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        break; // Fall back to local parsing
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        aiFilters = JSON.parse(toolCall.function.arguments);
        console.log("Parsed filters:", aiFilters);
      }
      break;
    }

    // Use AI result or fall back to local parser
    const filters = aiFilters || buildFallbackFilters(query);

    return new Response(
      JSON.stringify({ filters, original_query: query }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error parsing search query:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/** Local fallback parser — extracts keywords from the query string */
function buildFallbackFilters(query: string) {
  const lower = query.toLowerCase();
  const setAsideMap: Record<string, string[]> = {
    "small business": ["Small Business"],
    "veteran": ["SDVOSB", "VOSB"],
    "woman": ["WOSB", "EDWOSB"],
    "minority": ["8(a)", "SDB"],
    "hubzone": ["HUBZone"],
  };

  const set_aside: string[] = [];
  for (const [keyword, codes] of Object.entries(setAsideMap)) {
    if (lower.includes(keyword)) set_aside.push(...codes);
  }

  const keywords = query.split(/\s+/).filter(w => w.length > 2 && !["contracts", "for", "the", "and", "with"].includes(w.toLowerCase()));

  return {
    keywords,
    naics_codes: [] as string[],
    set_aside,
    agencies: [] as string[],
    min_value: null,
    max_value: null,
    location: null,
    opportunity_type: null,
  };
}
