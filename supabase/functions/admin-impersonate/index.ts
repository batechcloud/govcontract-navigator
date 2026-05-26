import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsRes, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsRes?.claims) return json({ error: "Unauthorized" }, 401);
    const adminId = claimsRes.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Verify caller is admin
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: adminId });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body?.target_user_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(targetUserId)) {
      return json({ error: "Invalid target_user_id" }, 400);
    }

    // Look up target user
    const { data: target, error: tErr } = await admin.auth.admin.getUserById(targetUserId);
    if (tErr || !target?.user?.email) return json({ error: "Target user not found" }, 404);
    const targetEmail = target.user.email;

    // Prevent admin-on-admin impersonation
    const { data: targetIsAdmin } = await admin.rpc("is_admin", { _user_id: targetUserId });
    if (targetIsAdmin) return json({ error: "Cannot impersonate another admin" }, 403);

    // Mint a session for the target user via magiclink
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      return json({ error: linkErr?.message || "Failed to generate session" }, 500);
    }

    const verifyClient = createClient(SUPABASE_URL, ANON);
    const { data: sess, error: vErr } = await verifyClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    });
    if (vErr || !sess?.session) {
      return json({ error: vErr?.message || "Failed to mint session" }, 500);
    }

    // Audit
    await admin.from("sync_audit_log").insert({
      actor_id: adminId,
      action: "admin.impersonate.start",
      details: {
        target_user_id: targetUserId,
        target_email: targetEmail,
        ip: req.headers.get("x-forwarded-for") ?? null,
        ua: req.headers.get("user-agent") ?? null,
      },
    });

    // Profile for nicer banner
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", targetUserId)
      .maybeSingle();

    return json({
      access_token: sess.session.access_token,
      refresh_token: sess.session.refresh_token,
      target: {
        id: targetUserId,
        email: targetEmail,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
      },
    }, 200);
  } catch (e) {
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
