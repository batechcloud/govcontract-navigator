// Workspace owner hard-deletes a teammate (auth user + all their data).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({ user_id: z.string().uuid() });

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e: any) {
    return json({ error: "Invalid request", details: e?.errors ?? String(e) }, 400);
  }

  if (body.user_id === callerId) {
    return json({ error: "You cannot remove yourself." }, 400);
  }

  // Caller must be owner of the same workspace as the target.
  const { data: caller } = await admin
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", callerId)
    .maybeSingle();
  if (!caller || caller.role !== "owner") {
    return json({ error: "Only workspace owners can remove users." }, 403);
  }

  const { data: target } = await admin
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", body.user_id)
    .maybeSingle();
  if (!target || target.workspace_id !== caller.workspace_id) {
    return json({ error: "User is not in your workspace." }, 404);
  }
  if (target.role === "owner") {
    return json({ error: "Cannot remove the workspace owner." }, 400);
  }

  // Cascade delete app data, then auth user.
  const { error: rpcErr } = await admin.rpc("delete_user_cascade", { _user_id: body.user_id });
  if (rpcErr) return json({ error: `Data cleanup failed: ${rpcErr.message}` }, 500);

  const { error: delErr } = await admin.auth.admin.deleteUser(body.user_id);
  if (delErr) return json({ error: `Auth delete failed: ${delErr.message}` }, 500);

  await admin.from("sync_audit_log").insert({
    actor_id: callerId,
    action: "workspace_remove",
    details: { workspace_id: caller.workspace_id, removed_user_id: body.user_id },
  });

  return json({ ok: true });
});
