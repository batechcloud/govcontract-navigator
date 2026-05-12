// Sends a Supabase Auth invite email to an admin candidate.
// The recipient email MUST already be present in the public.admin_emails
// table. An existing admin adds the email via SQL first (single source of
// truth), then the candidate (or anyone) can call this endpoint to send
// the invite — no dashboard access needed.
//
// Uses supabase.auth.admin.inviteUserByEmail() which delivers a default
// Supabase invite email (no custom email infra needed).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().email().max(255),
  redirect_to: z.string().url().optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return json({ error: "Invalid request", details: String(e) }, 400);
  }

  const targetEmail = body.email.toLowerCase().trim();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Hard requirement: invitee must already be in the admin_emails table.
  // Safe to leave this endpoint unauthenticated because anyone can only
  // invite addresses an existing admin has authorized via SQL.
  const { data: allowedRow } = await admin
    .from("admin_emails")
    .select("email")
    .ilike("email", targetEmail)
    .maybeSingle();

  if (!allowedRow) {
    return json(
      { error: "Email not in admin_emails allowlist. An existing admin must add it via SQL first." },
      403,
    );
  }

  const redirectTo = body.redirect_to ??
    `${req.headers.get("origin") ?? ""}/admin/login`;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(targetEmail, {
    redirectTo,
  });

  if (error) {
    // If the user already exists, fall back to a magic-link / password reset
    // so they still receive an actionable email.
    if (/already.*registered|already exists|user_already_exists/i.test(error.message)) {
      const { error: linkErr } = await admin.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });
      if (linkErr) return json({ error: linkErr.message }, 500);
      return json({
        ok: true,
        mode: "password_reset",
        message: "User already exists — sent a password reset email instead.",
      });
    }
    return json({ error: error.message }, 500);
  }

  await admin.from("sync_audit_log").insert({
    action: "admin_invite_sent",
    details: { email: targetEmail, user_id: data.user?.id ?? null },
  });

  return json({
    ok: true,
    mode: "invite",
    message: `Invite sent to ${targetEmail}. Check your inbox.`,
    user_id: data.user?.id ?? null,
  });
});
