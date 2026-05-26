// One-shot bootstrap to create a test superadmin user.
// Call once with: POST { bootstrap_secret: "<SUPABASE_SERVICE_ROLE_KEY>" }
// Safe to call multiple times — it upserts.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEST_EMAIL = "superadmin.test@gcnavigator.dev";
const TEST_PASSWORD = "TempAdmin!2026Change";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    // Simple shared-secret guard so randoms can't trigger this.
    const body = await req.json().catch(() => ({}));
    if (body?.bootstrap_secret !== SERVICE) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Make sure email is on the allowlist
    await admin.from("admin_emails").upsert({ email: TEST_EMAIL });

    // Check if user already exists
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === TEST_EMAIL);

    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: TEST_PASSWORD,
        email_confirm: true,
        ban_duration: "none",
      });
      return new Response(
        JSON.stringify({ ok: true, status: "updated", user_id: existing.id, email: TEST_EMAIL }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Super", last_name: "Admin" },
    });
    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, status: "created", user_id: created.user?.id, email: TEST_EMAIL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("bootstrap-test-admin error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
