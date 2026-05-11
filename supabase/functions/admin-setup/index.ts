// Protected admin setup endpoint.
// Gated by the ADMIN_SETUP_TOKEN secret (sent in the x-setup-token header).
//
// What it does:
//   1. Reads the ADMIN_EMAILS allowlist from env.
//   2. Syncs the admin_emails table to match (insert missing, delete stale).
//   3. For each allowlisted email:
//        - if no auth user exists, creates one with email_confirmed = true
//          and sends a password-reset/invite link the admin uses to set a password.
//        - if a user exists, sends a password-reset link (idempotent).
//   4. Returns a setup report and a checklist of required auth settings the
//      project owner must verify in the Supabase dashboard (these can't be
//      changed via the public API without a management token).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ---- Gate: protected by a shared setup token --------------------------
  const expected = Deno.env.get("ADMIN_SETUP_TOKEN");
  if (!expected) {
    return json({ error: "ADMIN_SETUP_TOKEN is not configured on the server" }, 500);
  }
  const provided = req.headers.get("x-setup-token") || "";
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ---- Parse optional body ---------------------------------------------
  let redirectTo: string | undefined;
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (typeof body?.redirect_to === "string") redirectTo = body.redirect_to;
  } catch { /* ignore */ }

  // ---- Build allowlist --------------------------------------------------
  const allowlist = (Deno.env.get("ADMIN_EMAILS") ?? "")
    .split(/[,\s;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (allowlist.length === 0) {
    return json({ error: "ADMIN_EMAILS is empty or contains no valid emails" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- 1. Sync admin_emails table --------------------------------------
  const { data: existingRows } = await admin.from("admin_emails").select("email");
  const existing = new Set((existingRows ?? []).map((r: any) => r.email.toLowerCase()));
  const toInsert = allowlist.filter((e) => !existing.has(e));
  const toDelete = [...existing].filter((e) => !allowlist.includes(e));

  if (toInsert.length) {
    await admin.from("admin_emails").insert(toInsert.map((email) => ({ email })));
  }
  if (toDelete.length) {
    await admin.from("admin_emails").delete().in("email", toDelete);
  }

  // ---- 2. Provision auth users -----------------------------------------
  const results: Array<{ email: string; status: string; action_link?: string; error?: string }> = [];

  for (const email of allowlist) {
    try {
      // Check if a user already exists for this email
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existingUser = list?.users?.find((u) => (u.email || "").toLowerCase() === email);

      if (!existingUser) {
        // Create the user, auto-confirm so they can sign in immediately
        const { error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { provisioned_by: "admin-setup" },
        });
        if (createErr && !/registered|exists/i.test(createErr.message)) {
          results.push({ email, status: "create_failed", error: createErr.message });
          continue;
        }
      }

      // Send a reset/invite link so the admin sets their own password
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: existingUser ? "recovery" : "invite",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (linkErr) {
        results.push({ email, status: "link_failed", error: linkErr.message });
        continue;
      }

      results.push({
        email,
        status: existingUser ? "reset_sent" : "invited",
        action_link: linkData?.properties?.action_link,
      });
    } catch (err: any) {
      results.push({ email, status: "error", error: err?.message || String(err) });
    }
  }

  // ---- 3. Audit ---------------------------------------------------------
  await admin.from("sync_audit_log").insert({
    actor_id: null,
    action: "admin_setup_run",
    details: {
      timestamp: new Date().toISOString(),
      allowlist_size: allowlist.length,
      inserted_into_table: toInsert,
      removed_from_table: toDelete,
      provisioned: results.map((r) => ({ email: r.email, status: r.status })),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    },
  });

  // ---- 4. Required auth settings checklist -----------------------------
  // These cannot be set programmatically without a Supabase management API
  // token. Surface them so the operator can verify them in the dashboard.
  const requiredAuthSettings = {
    site_url: "Set to your production URL (used in invite/reset emails)",
    redirect_urls: "Add /admin/login and /auth/callback for every environment",
    email_confirmations: "Enabled (we auto-confirm provisioned admins, but new self-signups should still confirm)",
    password_min_length: ">= 12",
    password_strength: "Enable lower+upper+digit+symbol requirements",
    leaked_password_protection: "Enabled (HaveIBeenPwned)",
    rate_limits: "Keep default email + token-verification limits",
    mfa_totp: "Enabled — admins should enroll an authenticator app",
    jwt_expiry: "<= 3600 seconds for admin sessions",
  };

  return json({
    ok: true,
    allowlist,
    table_sync: { inserted: toInsert, removed: toDelete },
    users: results,
    required_auth_settings: requiredAuthSettings,
    next_steps: [
      "Distribute the action_link values above to each admin (or have them check inbox).",
      "Verify the required_auth_settings in Supabase Dashboard → Authentication.",
      "Rotate ADMIN_SETUP_TOKEN after initial bootstrap.",
    ],
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
