import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const USASPENDING_API = "https://api.usaspending.gov/api/v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`USAspending search by user: ${user.id}`);

    const ActionSchema = z.object({
      action: z.enum(["search_recipients", "get_recipient_profile", "get_recipient_awards", "search_awards", "search_subawards"]),
      params: z.object({
        keyword: z.string().max(500).optional(),
        page: z.number().int().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        recipient_id: z.string().max(200).optional(),
        recipient_hash: z.string().max(200).optional(),
        recipient_name: z.string().max(500).optional(),
        sort: z.string().max(50).optional(),
        order: z.enum(["asc", "desc"]).optional(),
        agency: z.string().max(300).optional(),
        min_amount: z.number().nonnegative().optional(),
        max_amount: z.number().nonnegative().optional(),
        prime_contractor: z.string().max(500).optional(),
      }).default({}),
    });

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params } = parsed.data;
    console.log(`USAspending search action: ${action}`, params);

    let result;

    switch (action) {
      case "search_recipients":
        result = await searchRecipients(params.keyword || "", params.page || 1);
        break;
      case "get_recipient_profile":
        result = await getRecipientProfile(params.recipient_id || "");
        break;
      case "get_recipient_awards":
        result = await getRecipientAwards(params.recipient_hash || "", params.page || 1, params.limit || 25);
        break;
      case "search_awards":
        result = await searchAwardsByRecipient(params.recipient_name || "", params.page || 1, params.limit || 25);
        break;
      case "search_subawards":
        result = await searchSubawards(params);
        break;
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
    body: JSON.stringify({ search_text: keyword, limit: 20 }),
  });
  if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
  const data = await response.json();
  return { results: data.results || [], count: data.results?.length || 0 };
}

async function getRecipientProfile(recipientId: string) {
  const response = await fetch(`${USASPENDING_API}/recipient/${recipientId}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
  return await response.json();
}

async function getRecipientAwards(recipientHash: string, page: number, limit: number) {
  const response = await fetch(`${USASPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        recipient_id: [recipientHash],
        time_period: [{
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        }],
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date", "Description", "NAICS Code", "PSC Code", "Place of Performance City", "Place of Performance State Code"],
      page, limit, sort: "Award Amount", order: "desc",
    }),
  });
  if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
  return await response.json();
}

async function searchAwardsByRecipient(recipientName: string, page: number, limit: number) {
  const response = await fetch(`${USASPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        recipient_search_text: [recipientName],
        time_period: [{
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        }],
        award_type_codes: ["A", "B", "C", "D"],
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date", "Description", "NAICS Code", "PSC Code", "Place of Performance City", "Place of Performance State Code", "recipient_uei"],
      page, limit, sort: "Award Amount", order: "desc",
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('USAspending error response:', errorText);
    throw new Error(`USAspending API error: ${response.status}`);
  }
  return await response.json();
}

async function searchSubawards(params: {
  keyword?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  agency?: string;
  min_amount?: number;
  max_amount?: number;
  prime_contractor?: string;
}) {
  const {
    keyword = "",
    page = 1,
    limit = 25,
    sort = "amount",
    order = "desc",
    prime_contractor,
  } = params;

  // Combine keyword with prime_contractor for broader search
  let combinedKeyword = keyword;
  if (prime_contractor) {
    combinedKeyword = combinedKeyword ? `${combinedKeyword} ${prime_contractor}` : prime_contractor;
  }

  // When keyword is present, sort by action_date (most recent) for relevance
  // instead of amount which returns the same outlier records regardless of keyword
  const effectiveSort = combinedKeyword ? "action_date" : sort;
  const effectiveOrder = combinedKeyword ? "desc" : order;

  // Request more results so we have enough after post-filtering
  const fetchLimit = combinedKeyword ? Math.min(limit * 4, 100) : limit;

  const response = await fetch(`${USASPENDING_API}/subawards/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page,
      limit: fetchLimit,
      sort: effectiveSort,
      order: effectiveOrder,
      ...(combinedKeyword ? { keyword: combinedKeyword } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('USAspending subawards error:', errorText);
    throw new Error(`USAspending subawards API error: ${response.status}`);
  }

  const data = await response.json();

  // Client-side filtering (the subawards endpoint has limited server-side filtering)
  let results = data.results || [];

  // Post-filter: ensure keyword terms actually appear in description or recipient name
  if (combinedKeyword) {
    const terms = combinedKeyword.toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter((r: any) => {
      const text = [
        r.description || "",
        r.subaward_description || "",
        r.recipient_name || "",
        r.sub_awardee_or_recipient_legal || "",
        r.prime_recipient_name || "",
        r.awarding_agency_name || "",
      ].join(" ").toLowerCase();
      // At least one keyword term must appear in the combined text
      return terms.some(t => text.includes(t));
    });
  }

  if (prime_contractor) {
    const lc = prime_contractor.toLowerCase();
    results = results.filter((r: any) =>
      (r.prime_recipient_name || "").toLowerCase().includes(lc)
    );
  }

  if (params.min_amount !== undefined) {
    results = results.filter((r: any) => (r.subaward_amount || r.amount || 0) >= params.min_amount!);
  }
  if (params.max_amount !== undefined) {
    results = results.filter((r: any) => (r.subaward_amount || r.amount || 0) <= params.max_amount!);
  }
  if (params.agency) {
    const agLc = params.agency.toLowerCase();
    results = results.filter((r: any) =>
      (r.awarding_agency_name || "").toLowerCase().includes(agLc)
    );
  }

  // Trim back to requested limit after filtering
  results = results.slice(0, limit);

  return {
    ...data,
    results,
    page_metadata: {
      ...data.page_metadata,
      // Adjust if we filtered down significantly
      total: data.page_metadata?.total ?? results.length,
    },
  };
}
