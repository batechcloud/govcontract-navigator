import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const apiKey = Deno.env.get("SAM_API_KEY") || "";
  const meta = {
    present: !!apiKey,
    length: apiKey.length,
    first4: apiKey.slice(0, 4),
    last4: apiKey.slice(-4),
    hasWhitespace: /\s/.test(apiKey),
  };
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 86400000);
  const fmt = (d: Date) => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
  const url = `https://api.sam.gov/opportunities/v2/search?api_key=${encodeURIComponent(apiKey)}&limit=1&postedFrom=${fmt(from)}&postedTo=${fmt(today)}&active=true`;
  let status = 0; let body = "";
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    status = r.status;
    body = (await r.text()).slice(0, 500);
  } catch (e) {
    body = String(e);
  }
  return new Response(JSON.stringify({ meta, sam: { status, body } }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
