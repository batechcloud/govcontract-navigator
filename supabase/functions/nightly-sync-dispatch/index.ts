// Cron entry point — fans out to both source sync functions in parallel
// so one source failing cannot block the other.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

/** True if SAM hit its daily quota in the most recent run within the last 24h. */
async function samRateLimited(): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("sync_runs")
    .select("status, started_at")
    .eq("source", "sam")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(1);
  return !!data?.[0] && data[0].status === "rate_limited";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let manual = false;
  try { const b = await req.json(); manual = !!b?.manual; } catch { /* empty */ }

  const skipSam = await samRateLimited();
  if (skipSam) console.warn("nightly-sync-dispatch: skipping SAM — last run was rate_limited within 24h.");

  const tasks: Array<Promise<unknown>> = [
    skipSam
      ? Promise.resolve({ name: "nightly-sync-sam", skipped: true, reason: "rate_limited_within_24h" })
      : invoke("nightly-sync-sam", manual),
    invoke("nightly-sync-usaspending", manual),
  ];
  const results = await Promise.allSettled(tasks);

  const payload = results.map((r) =>
    r.status === "fulfilled" ? r.value : { error: String((r as PromiseRejectedResult).reason) }
  );

  return new Response(JSON.stringify({ ok: true, results: payload }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

