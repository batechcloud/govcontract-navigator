import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USAspending.gov API base URL
const USASPENDING_API = "https://api.usaspending.gov/api/v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`USAspending search action: ${action}`, params);

    let result;

    switch (action) {
      case "search_recipients":
        // Search for contractors/recipients by name
        result = await searchRecipients(params.keyword, params.page || 1);
        break;

      case "get_recipient_profile":
        // Get detailed recipient info
        result = await getRecipientProfile(params.recipient_id);
        break;

      case "get_recipient_awards":
        // Get awards for a specific recipient
        result = await getRecipientAwards(params.recipient_hash, params.page || 1, params.limit || 25);
        break;

      case "search_awards":
        // Search awards by recipient name
        result = await searchAwardsByRecipient(params.recipient_name, params.page || 1, params.limit || 25);
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('USAspending search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchRecipients(keyword: string, page: number) {
  const response = await fetch(`${USASPENDING_API}/autocomplete/recipient/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search_text: keyword,
      limit: 20,
    }),
  });

  if (!response.ok) {
    throw new Error(`USAspending API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    results: data.results || [],
    count: data.results?.length || 0,
  };
}

async function getRecipientProfile(recipientId: string) {
  const response = await fetch(`${USASPENDING_API}/recipient/${recipientId}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`USAspending API error: ${response.status}`);
  }

  return await response.json();
}

async function getRecipientAwards(recipientHash: string, page: number, limit: number) {
  // Use spending_by_award endpoint with recipient filter
  const response = await fetch(`${USASPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        recipient_id: [recipientHash],
        time_period: [
          {
            start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0], // 3 years
            end_date: new Date().toISOString().split('T')[0],
          }
        ],
      },
      fields: [
        "Award ID",
        "Recipient Name",
        "Award Amount",
        "Awarding Agency",
        "Start Date",
        "Description",
        "NAICS Code",
        "PSC Code",
        "Place of Performance City",
        "Place of Performance State Code",
      ],
      page,
      limit,
      sort: "Award Amount",
      order: "desc",
    }),
  });

  if (!response.ok) {
    throw new Error(`USAspending API error: ${response.status}`);
  }

  return await response.json();
}

async function searchAwardsByRecipient(recipientName: string, page: number, limit: number) {
  const response = await fetch(`${USASPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        recipient_search_text: [recipientName],
        time_period: [
          {
            start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          }
        ],
        award_type_codes: ["A", "B", "C", "D"], // Contracts only
      },
      fields: [
        "Award ID",
        "Recipient Name", 
        "Award Amount",
        "Awarding Agency",
        "Start Date",
        "Description",
        "NAICS Code",
        "PSC Code",
        "Place of Performance City",
        "Place of Performance State Code",
        "recipient_uei",
      ],
      page,
      limit,
      sort: "Award Amount",
      order: "desc",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('USAspending error response:', errorText);
    throw new Error(`USAspending API error: ${response.status}`);
  }

  return await response.json();
}
