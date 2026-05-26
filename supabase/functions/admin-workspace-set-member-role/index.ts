// Admin updates a workspace member's role (viewer/editor). Owner role locked.
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
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: callerId });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const workspaceId = String(body?.workspace_id ?? "");
    const userId = String(body?.user_id ?? "");
    const role = String(body?.role ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) return json({ error: "Invalid workspace_id" }, 400);
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Invalid user_id" }, 400);
    if (!["viewer", "editor"].includes(role)) return json({ error: "Invalid role" }, 400);

    const { data: target } = await admin
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!target) return json({ error: "Member not found" }, 404);
    if (target.role === "owner") return json({ error: "Cannot change owner's role" }, 400);

    const { error } = await admin
      .from("workspace_members")
      .update({ role })
      .eq("id", target.id);
    if (error) return json({ error: error.message }, 500);

    await admin.from("sync_audit_log").insert({
      actor_id: callerId,
      action: "admin.workspace.member_role_update",
      details: { workspace_id: workspaceId, user_id: userId, role },
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
