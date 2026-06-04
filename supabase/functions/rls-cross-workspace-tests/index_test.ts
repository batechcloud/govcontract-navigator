// Cross-workspace RLS integration tests.
//
// Creates two ephemeral users (each gets their own workspace via the
// handle_new_user trigger) and verifies that user A cannot read or write
// user B's workspace-scoped data, and vice versa.
//
// Requires: SUPABASE_URL + SUPABASE_ANON_KEY (loaded from .env).
// SUPABASE_SERVICE_ROLE_KEY is optional — when present we clean up the
// ephemeral users at the end of the run. Without it the test users remain
// in auth.users (harmless, just noise in the dashboard).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY/PUBLISHABLE_KEY must be set");
}

const admin = SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

type Ctx = {
  userId: string;
  email: string;
  password: string;
  workspaceId: string;
  client: SupabaseClient;
};

async function provisionUser(label: string): Promise<Ctx> {
  const email = `rls-${label}-${crypto.randomUUID()}@example.test`;
  const password = `Test!${crypto.randomUUID()}`;

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Sign up via anon client. Requires email confirmations to be OFF (the
  // default for new Supabase projects). handle_new_user provisions a workspace.
  const { data: signUp, error: signUpErr } = await client.auth.signUp({
    email,
    password,
    options: { data: { first_name: `RLS-${label}` } },
  });
  if (signUpErr || !signUp.user) throw new Error(`signUp ${label}: ${signUpErr?.message}`);

  if (!signUp.session) {
    const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
    if (signInErr) {
      throw new Error(
        `Cannot establish a session for ${email} (${signInErr.message}). ` +
        `Disable "Confirm email" in Supabase auth settings to run these tests.`,
      );
    }
  }
  const userId = signUp.user.id;

  let workspaceId: string | null = null;
  for (let i = 0; i < 15; i++) {
    const { data } = await client
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.workspace_id) { workspaceId = data.workspace_id; break; }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!workspaceId) throw new Error(`workspace not provisioned for ${label}`);

  return { userId, email, password, workspaceId, client };
}

async function cleanup(ctx: Ctx) {
  try { await ctx.client.auth.signOut(); } catch (_) { /* noop */ }
  if (!admin) return;
  try { await admin.rpc("delete_user_cascade", { _user_id: ctx.userId }); } catch (_) { /* noop */ }
  try { await admin.from("workspaces").delete().eq("owner_id", ctx.userId); } catch (_) { /* noop */ }
  try { await admin.auth.admin.deleteUser(ctx.userId); } catch (_) { /* noop */ }
}

/** Seed one row per workspace-scoped table for the given user/workspace. */
async function seed(ctx: Ctx) {
  // Use the user's own client so triggers/policies populate workspace_id correctly.
  const { error: tcErr } = await ctx.client.from("tracked_contracts").insert({
    user_id: ctx.userId,
    contract_id: `seed-${ctx.userId}`,
    contract_title: "seed contract",
  });
  if (tcErr) throw new Error(`seed tracked_contracts: ${tcErr.message}`);

  const { error: ssErr } = await ctx.client.from("saved_searches").insert({
    user_id: ctx.userId,
    name: "seed search",
    query: "seed",
    filters: { keyword: "seed" },
  });
  if (ssErr) throw new Error(`seed saved_searches: ${ssErr.message}`);

  const { error: cpErr } = await ctx.client.from("company_profiles").insert({
    user_id: ctx.userId,
    company_name: `seed-co-${ctx.userId.slice(0, 6)}`,
  });
  if (cpErr) throw new Error(`seed company_profiles: ${cpErr.message}`);

  const { error: cmpErr } = await ctx.client.from("tracked_competitors").insert({
    user_id: ctx.userId,
    competitor_name: "seed competitor",
  });
  if (cmpErr) throw new Error(`seed tracked_competitors: ${cmpErr.message}`);
}

Deno.test({
  name: "RLS: cross-workspace reads/writes are denied",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const a = await provisionUser("a");
    const b = await provisionUser("b");

    try {
      assert(a.workspaceId !== b.workspaceId, "users must land in different workspaces");

      await seed(a);
      await seed(b);

      await t.step("A cannot SELECT B's workspaces row", async () => {
        const { data, error } = await a.client
          .from("workspaces").select("id").eq("id", b.workspaceId);
        assertEquals(error, null);
        assertEquals(data?.length ?? 0, 0, "A should not see B's workspace");
      });

      await t.step("A cannot SELECT B's workspace_members", async () => {
        const { data, error } = await a.client
          .from("workspace_members").select("user_id").eq("workspace_id", b.workspaceId);
        assertEquals(error, null);
        assertEquals(data?.length ?? 0, 0);
      });

      const scopedTables = [
        "tracked_contracts",
        "saved_searches",
        "company_profiles",
        "tracked_competitors",
        "proposals",
        "chat_conversations",
        "user_documents",
      ] as const;

      for (const tbl of scopedTables) {
        await t.step(`A cannot SELECT B's rows in ${tbl}`, async () => {
          const { data, error } = await a.client
            .from(tbl).select("*").eq("user_id", b.userId);
          assertEquals(error, null, `${tbl}: ${error?.message}`);
          assertEquals(data?.length ?? 0, 0, `${tbl}: A saw B's rows`);
        });
      }

      await t.step("A cannot INSERT a row impersonating B (tracked_contracts)", async () => {
        const { error } = await a.client.from("tracked_contracts").insert({
          user_id: b.userId,
          contract_id: `evil-${crypto.randomUUID()}`,
          contract_title: "cross-tenant write attempt",
        });
        assert(error !== null, "insert as B from A's session should be blocked");
      });

      await t.step("A cannot INSERT a workspace_member into B's workspace", async () => {
        const { error } = await a.client.from("workspace_members").insert({
          workspace_id: b.workspaceId,
          user_id: a.userId,
          role: "editor",
        });
        assert(error !== null, "non-owner should not insert into B's workspace");
      });

      await t.step("A cannot UPDATE B's tracked_contracts row", async () => {
        // B reads its own row (this is the only way to learn the id without service_role).
        const { data: brow } = await b.client
          .from("tracked_contracts").select("id").eq("user_id", b.userId).limit(1).single();
        assert(brow?.id, "B should have a seed row");

        const { data, error } = await a.client
          .from("tracked_contracts")
          .update({ contract_title: "tampered" })
          .eq("id", brow!.id)
          .select();
        // RLS makes the row invisible to A: no error, but zero rows affected.
        assertEquals(error, null);
        assertEquals(data?.length ?? 0, 0, "A must not be able to update B's row");

        // Confirm via B that the title is unchanged.
        const { data: after } = await b.client
          .from("tracked_contracts").select("contract_title").eq("id", brow!.id).single();
        assert(after?.contract_title !== "tampered", "B's row title must not have been mutated");
      });

      await t.step("A cannot DELETE B's tracked_contracts row", async () => {
        const { data: brow } = await b.client
          .from("tracked_contracts").select("id").eq("user_id", b.userId).limit(1).single();
        const { data, error } = await a.client
          .from("tracked_contracts")
          .delete()
          .eq("id", brow!.id)
          .select();
        assertEquals(error, null);
        assertEquals(data?.length ?? 0, 0);

        // B still sees its row.
        const { data: still } = await b.client
          .from("tracked_contracts").select("id").eq("id", brow!.id).maybeSingle();
        assert(still, "B's row must still exist");
      });


      await t.step("A cannot DELETE B's workspace", async () => {
        const { data, error } = await a.client
          .from("workspaces").delete().eq("id", b.workspaceId).select();
        assertEquals(error, null);
        assertEquals(data?.length ?? 0, 0);
      });

      await t.step("Sanity: A can read its own workspace + rows", async () => {
        const { data: ws } = await a.client
          .from("workspaces").select("id").eq("id", a.workspaceId).maybeSingle();
        assertEquals(ws?.id, a.workspaceId);

        const { data: own } = await a.client
          .from("tracked_contracts").select("id").eq("user_id", a.userId);
        assert((own?.length ?? 0) >= 1, "A must see its own seed row");
      });
    } finally {
      await cleanup(a);
      await cleanup(b);
    }
  },
});
