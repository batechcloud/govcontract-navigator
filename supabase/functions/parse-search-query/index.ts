import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Parsing search query:", query);

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
          {
            role: "user",
            content: query
          }
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const filters = JSON.parse(toolCall.function.arguments);
      console.log("Parsed filters:", filters);
      return new Response(
        JSON.stringify({ filters, original_query: query }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: return basic keyword search
    return new Response(
      JSON.stringify({ 
        filters: { 
          keywords: query.split(' ').filter(w => w.length > 2),
          naics_codes: [],
          set_aside: [],
          agencies: [],
          min_value: null,
          max_value: null,
          location: null,
          opportunity_type: null
        }, 
        original_query: query 
      }),
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
