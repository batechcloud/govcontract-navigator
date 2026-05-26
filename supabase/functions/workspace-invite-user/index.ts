// Workspace owner creates a teammate account with a temporary password.
// Manual JWT verification; caller must be owner of their workspace.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().email().max(255),
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  role: z.enum(["viewer", "editor"]).default("viewer"),
  temp_password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/\d/, "Must include a digit")
    .regex(/[^A-Za-z0-9]/, "Must include a symbol"),
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

  const { data: membership } = await admin
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", callerId)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return json({ error: "Only workspace owners can invite users." }, 403);
  }

  const email = body.email.toLowerCase().trim();

  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing?.users?.some((u) => (u.email || "").toLowerCase() === email)) {
    return json({ error: "A user with this email already exists." }, 409);
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: body.temp_password,
    email_confirm: true,
    user_metadata: {
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      invited_workspace_id: membership.workspace_id,
      invited_role: body.role,
      invited_by: callerId,
      must_change_password: true,
    },
  });

  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? "Failed to create user" }, 500);
  }

  await admin.from("sync_audit_log").insert({
    actor_id: callerId,
    action: "workspace_invite",
    details: {
      workspace_id: membership.workspace_id,
      new_user_id: created.user.id,
      email,
      role: body.role,
    },
  });

  return json({ ok: true, user_id: created.user.id, email, role: body.role });
});
