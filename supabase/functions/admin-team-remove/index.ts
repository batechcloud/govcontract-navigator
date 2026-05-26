// Superadmin removes a team member's admin-tier roles (keeps user account intact).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isSuper } = await admin.rpc("is_admin", { _user_id: callerId });
    if (!isSuper) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetId = String(body?.user_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return json({ error: "Invalid user_id" }, 400);
    if (targetId === callerId) return json({ error: "You cannot remove yourself" }, 400);

    // Prevent removing last superadmin
    const { data: targetAdmin } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", targetId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetAdmin) {
      const { count } = await admin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) return json({ error: "Cannot remove the last superadmin" }, 400);
    }

    await admin
      .from("user_roles")
      .delete()
      .eq("user_id", targetId)
      .in("role", ["admin", "subscription_manager", "workspace_admin"]);

    await admin.from("sync_audit_log").insert({
      actor_id: callerId,
      action: "admin.team.remove",
      details: { target_user_id: targetId },
    });

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});

function json(b: unknown, s: number) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
