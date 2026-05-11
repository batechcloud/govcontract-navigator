// Logs admin login attempts (success and failure) to sync_audit_log.
// Public endpoint — must accept failed attempts where user has no session.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().email().max(254),
  success: z.boolean(),
  reason: z.string().max(200).optional(),
  stage: z.enum(["password", "allowlist"]).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return json({ error: "Invalid request", details: String(e) }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Best-effort actor lookup
  let actorId: string | null = null;
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await admin.auth.getUser(token);
      actorId = data.user?.id ?? null;
    } catch { /* ignore */ }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") || null;

  await admin.from("sync_audit_log").insert({
    actor_id: actorId,
    action: body.success ? "admin_login_success" : "admin_login_failure",
    details: {
      email: body.email.toLowerCase(),
      stage: body.stage ?? null,
      reason: body.reason ?? null,
      ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    },
  });

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
