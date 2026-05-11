// Syncs the ADMIN_EMAILS secret into the public.admin_emails allowlist.
// Idempotent. Called by the admin login page right after sign-in so the
// `is_admin()` SQL function (used by RLS) sees the up-to-date allowlist
// without anyone manually editing the database.
//
// Returns { is_admin: boolean } for the calling user (if signed in).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseAdminEmails(): string[] {
  const raw = Deno.env.get("ADMIN_EMAILS") ?? "";
  return raw
    .split(/[,\s;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const emails = parseAdminEmails();

  // Reconcile allowlist with the current ADMIN_EMAILS secret value.
  if (emails.length > 0) {
    await admin
      .from("admin_emails")
      .upsert(emails.map((email) => ({ email })), { onConflict: "email" });
  }
  // Remove any emails no longer in the secret
  const { data: existing } = await admin.from("admin_emails").select("email");
  const stale = (existing ?? [])
    .map((r: { email: string }) => r.email.toLowerCase())
    .filter((e) => !emails.includes(e));
  if (stale.length > 0) {
    await admin.from("admin_emails").delete().in("email", stale);
  }

  // If a user JWT was supplied, return their admin status
  const authHeader = req.headers.get("Authorization") || "";
  let isAdmin = false;
  let email: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (user?.email) {
      email = user.email.toLowerCase();
      isAdmin = emails.includes(email);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, is_admin: isAdmin, email, count: emails.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
