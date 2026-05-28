// Admin-triggered manual sync. Validates caller is admin, then invokes
// the matching nightly-sync function(s) with manual=true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function invoke(name: string, userId: string): Promise<unknown> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ manual: true, triggered_by: userId }),
  });
  const data = await resp.json().catch(() => ({}));
  return { name, status: resp.status, ...data };
}

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

    // Server-side admin check
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

    const targets = source === "both"
      ? ["nightly-sync-sam", "nightly-sync-usaspending"]
      : [source === "sam" ? "nightly-sync-sam" : "nightly-sync-usaspending"];

    // Fire-and-forget so the UI returns immediately; the sync runs in background.
    for (const t of targets) {
      // intentionally not awaited
      invoke(t, userId).catch((e) => console.error(`invoke ${t}:`, e));
    }

    return new Response(JSON.stringify({ ok: true, started: targets }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
