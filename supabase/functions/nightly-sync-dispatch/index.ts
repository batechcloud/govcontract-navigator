// Cron entry point — fans out to both source sync functions in parallel
// so one source failing cannot block the other.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function invoke(name: string, manual: boolean): Promise<unknown> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ manual }),
  });
  const data = await resp.json().catch(() => ({}));
  return { name, status: resp.status, ...data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let manual = false;
  try { const b = await req.json(); manual = !!b?.manual; } catch { /* empty */ }

  const results = await Promise.allSettled([
    invoke("nightly-sync-sam", manual),
    invoke("nightly-sync-usaspending", manual),
  ]);

  const payload = results.map((r) =>
    r.status === "fulfilled" ? r.value : { error: String((r as PromiseRejectedResult).reason) }
  );

  return new Response(JSON.stringify({ ok: true, results: payload }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
