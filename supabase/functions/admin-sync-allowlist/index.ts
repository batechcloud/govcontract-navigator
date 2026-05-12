// Returns the calling user's admin status by checking the public.admin_emails table.
//
// History: this function used to reconcile admin_emails from the ADMIN_EMAILS
// env var on every admin login. That created a two-sources-of-truth problem
// (the env var was the source, table was a cache, but the cache was used by
// is_admin()/RLS and could drift). The table is now the single source of
// truth — manage admins via SQL — so this function just reads it.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { count } = await admin
    .from("admin_emails")
    .select("*", { count: "exact", head: true });

  const authHeader = req.headers.get("Authorization") || "";
  let isAdmin = false;
  let email: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (user?.email) {
      email = user.email.toLowerCase();
      const { data: row } = await admin
        .from("admin_emails")
        .select("email")
        .ilike("email", email)
        .maybeSingle();
      isAdmin = !!row;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, is_admin: isAdmin, email, count: count ?? 0 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
