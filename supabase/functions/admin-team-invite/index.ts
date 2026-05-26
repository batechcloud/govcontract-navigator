// Superadmin invites or grants admin role to a user by email.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ROLES = ["admin", "subscription_manager", "workspace_admin"] as const;
type Role = (typeof ROLES)[number];

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
    if (!isSuper) return json({ error: "Forbidden — superadmin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "") as Role;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
    if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);

    // Find existing user
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let target = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

    if (!target) {
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email);
      if (invErr || !invited?.user) return json({ error: invErr?.message || "Invite failed" }, 500);
      target = invited.user;
    }

    // Upsert role (one role row per user/role unique)
    const { error: rErr } = await admin
      .from("user_roles")
      .upsert({ user_id: target.id, role }, { onConflict: "user_id,role" });
    if (rErr) return json({ error: rErr.message }, 500);

    await admin.from("sync_audit_log").insert({
      actor_id: callerId,
      action: "admin.team.invite",
      details: { target_user_id: target.id, email, role },
    });

    return json({ ok: true, user_id: target.id, email, role });
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
