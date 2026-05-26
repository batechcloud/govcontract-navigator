# Superadmin Workspaces Dashboard

Give superadmins a dedicated page to see every workspace owner and suspend / reactivate their account, plus a temporary superadmin login you can use right now to test it.

## 1. New page: `/admin/workspaces`

Added next to the existing admin sections (Sync, Audit, Support, Workspaces).

**Table columns**
- Workspace name
- Owner name + email
- Plan (from `user_subscriptions` → `subscription_plans.display_name`, fallback "Starter")
- Members count
- Created date
- Status badge: **Active** / **Suspended**
- Actions: `Deactivate` (red) or `Reactivate` (green), plus `View members` expand

**Filters / UX**
- Search box (owner email, owner name, workspace name)
- Status filter: All / Active / Suspended
- Sort by created date / members
- Confirmation dialog before deactivating, with a reason field

**Expand row** shows all members of that workspace (name, email, role) — read-only.

## 2. Backend

### New SQL (migration)
- `profiles.is_suspended` already exists ✅ — reused as the source of truth.
- Add SECURITY DEFINER RPC `admin_list_workspaces()` returning one row per workspace with owner info, plan, member count, status, last-active. Restricted to `is_admin(auth.uid())`.
- Add `sync_audit_log` entry on every suspend/reactivate (table already exists).

### New edge function: `admin-set-user-active`
- Manual JWT verification + `is_admin` check (rejects non-admins).
- Input (Zod): `{ user_id: uuid, active: boolean, reason?: string }`.
- Uses service role to:
  1. Update `profiles.is_suspended`.
  2. Call `supabase.auth.admin.updateUserById(user_id, { ban_duration: active ? 'none' : '876000h' })` so the suspended user is actually logged out and blocked from signing in.
  3. Insert audit log row (`action: 'user_suspended' | 'user_reactivated'`, details include actor, target, reason).
- Returns `{ ok: true }`.

### Frontend hook
- `useAdminWorkspaces()` — React Query, calls the RPC.
- `useSetUserActive()` — mutation calling the edge function, invalidates `admin-workspaces`.

## 3. Navigation
- Add `Workspaces` item (Building2 icon) to the admin sidebar between Sync and Support.

## 4. Temporary superadmin credentials (for you to test)

The admin allowlist is the `admin_emails` table, populated from the `ADMIN_EMAILS` secret. To give you a working test login I will, in the migration:

1. Insert `superadmin.test@gcnavigator.dev` into `admin_emails` (idempotent, no-op if already present).
2. Create the user via Supabase auth admin in a one-shot edge function `bootstrap-test-admin` that I run once, with these credentials:
   - **Email:** `superadmin.test@gcnavigator.dev`
   - **Password:** `TempAdmin!2026Change`
   - Email auto-confirmed.
3. After you log in at `/admin/login` you can change the password from Supabase Auth or delete the user when done.

⚠️ Please rotate or delete this account after testing — credentials in chat are not a long-term secret.

## Out of scope
- Editing plans / billing from this page
- Bulk actions
- Deleting workspaces (suspension only; existing `delete_user_cascade` not exposed here)
- Realtime updates (manual refresh / React Query refetch)

## Files

**Create**
- `supabase/migrations/<ts>_admin_workspaces.sql` (RPC + seed admin email)
- `supabase/functions/admin-set-user-active/index.ts`
- `supabase/functions/bootstrap-test-admin/index.ts` (one-shot)
- `src/pages/AdminWorkspaces.tsx`
- `src/hooks/useAdminWorkspaces.tsx`

**Edit**
- `src/App.tsx` — register `/admin/workspaces` route
- Admin sidebar component — add nav item
- `supabase/config.toml` — register two new functions
- `mem://index.md` + new `mem://features/admin-workspaces`

Approve and I'll build it, then give you the test login to try.
