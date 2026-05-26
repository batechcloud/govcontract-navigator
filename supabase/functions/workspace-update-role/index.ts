// Workspace owner updates a member's role (viewer <-> editor). Owner role is locked.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["viewer", "editor"]),
});

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
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
    return json({ error: "You cannot change your own role." }, 400);
  }

  const { data: caller } = await admin
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", callerId)
    .maybeSingle();

  if (!caller || caller.role !== "owner") {
    return json({ error: "Only workspace owners can update roles." }, 403);
  }

  const { data: target } = await admin
    .from("workspace_members")
    .select("id, workspace_id, role")
    .eq("user_id", body.user_id)
    .maybeSingle();

  if (!target || target.workspace_id !== caller.workspace_id) {
    return json({ error: "User is not in your workspace." }, 404);
  }
  if (target.role === "owner") {
    return json({ error: "The workspace owner's role cannot be changed." }, 400);
  }

  const { error: updErr } = await admin
    .from("workspace_members")
    .update({ role: body.role })
    .eq("id", target.id);

  if (updErr) return json({ error: updErr.message }, 500);

  await admin.from("sync_audit_log").insert({
    actor_id: callerId,
    action: "workspace_role_update",
    details: { workspace_id: caller.workspace_id, user_id: body.user_id, role: body.role },
  });

  return json({ ok: true });
});
