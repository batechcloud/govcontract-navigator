import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsRes, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsRes?.claims) return json({ error: "Unauthorized" }, 401);
    const currentUserId = claimsRes.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const originalAdminId = String(body?.original_admin_id ?? "");

    const admin = createClient(SUPABASE_URL, SERVICE);
    await admin.from("sync_audit_log").insert({
      actor_id: originalAdminId || null,
      action: "admin.impersonate.end",
      details: {
        target_user_id: currentUserId,
        ended_by_admin: originalAdminId || null,
      },
    });

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
