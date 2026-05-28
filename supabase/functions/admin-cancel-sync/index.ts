// Admin-triggered cancel for in-progress sync runs. Flips cancel_requested
// on the latest 'running' sync_runs row for each requested source. The sync
// loop polls this flag between pages and exits gracefully.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({} as any));
    const source = body?.source as "sam" | "usaspending" | "both" | undefined;
    if (!source || !["sam", "usaspending", "both"].includes(source)) {
      return new Response(JSON.stringify({ error: "source must be sam | usaspending | both" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sources = source === "both" ? ["sam", "usaspending"] : [source];
    const cancelled: { source: string; run_id: string }[] = [];

    for (const s of sources) {
      const { data: run } = await admin
        .from("sync_runs")
        .select("id, started_at")
        .eq("source", s)
        .eq("status", "running")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (run?.id) {
        // Flip cancel flag so any live loop exits at next page boundary.
        // Also force-finalize the row: if the worker crashed/timed out
        // without updating status, the UI would otherwise spin forever.
        // If a live loop is still running it will overwrite finished_at
        // on its own clean exit — acceptable.
        await admin
          .from("sync_runs")
          .update({
            cancel_requested: true,
            status: "cancelled",
            finished_at: new Date().toISOString(),
          })
          .eq("id", run.id);
        cancelled.push({ source: s, run_id: run.id });
      }
    }


    return new Response(JSON.stringify({ ok: true, cancelled }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
