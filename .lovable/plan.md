## Admin Settings, Profile & Team Management

Add a full admin account area plus an admin team system with granular roles.

### 1. Admin Profile & Settings page (`/admin/settings`)

New page with tabs:

- **Profile** — first name, last name, avatar upload (reuses `avatars` bucket), updates `profiles` table.
- **Account** — change email (`supabase.auth.updateUser({ email })`), change password (`updateUser({ password })`), with current-password reverify.
- **Security** — sign out of all sessions, view recent admin logins (from `sync_audit_log` filtered by `actor_id`).
- **Team** — manage admin team members (see §3).

Add a "Settings" link to `AdminSidebar` and a user menu in `AdminLayout` header (avatar → Settings / Sign out).

### 2. New admin role system

Extend `app_role` enum (currently `admin`, `moderator`, `user`) with two scoped admin roles:

- `subscription_manager` — read/update `user_subscriptions`, view users; no impersonation, no support.
- `workspace_admin` — impersonate workspace owners, access support inbox, view workspaces/users; can no view or edit subscription.
- `admin` (existing, treated as superadmin) — full access, only role that can manage the admin team.

DB migration:

- `ALTER TYPE app_role ADD VALUE 'subscription_manager'; ADD VALUE 'workspace_admin';`
- Update `is_admin(uuid)` to return true for any of the three admin roles (so existing admin routes keep working), OR introduce `has_admin_access(uuid)` + keep `is_admin` strictly superadmin. **Recommendation:** new `has_admin_access()` function used by RLS/routes; keep `is_admin()` as superadmin gate for destructive actions and team management.
- New SECURITY DEFINER helpers: `can_manage_subscriptions(uuid)`, `can_impersonate(uuid)`.
- New RPCs: `admin_list_team()`, `admin_add_team_member(email, role)`, `admin_update_team_role(user_id, role)`, `admin_remove_team_member(user_id)` — all gated by superadmin check.

### 3. Team management UI (Settings → Team tab, superadmin only)

- Table of admin team members: email, role, added date, last active, remove button.
- "Add team member" dialog: email + role select (Subscription Manager / Workspace Admin / Superadmin).
- Calls new `admin-team-invite` edge function that either:
  - Finds existing auth user by email and inserts into `user_roles`, or
  - Sends invite via `admin.auth.admin.inviteUserByEmail`, then assigns role on signup.
- Role-change dropdown inline per row.
- Superadmin cannot remove the last superadmin (server-side guard).

### 4. Permission enforcement

- `useIsAdmin` → keep as "any admin access" check (drives sidebar visibility).
- New `useAdminRole()` hook returns `'admin' | 'subscription_manager' | 'workspace_admin' | null`.
- `AdminRoute` accepts optional `requiredRole` prop; route-level gates:
  - `/admin/subscriptions` — `subscription_manager` or `admin`
  - `/admin/workspaces`, `/admin/support`, impersonate button — `workspace_admin` or `admin`
  - `/admin/users`, `/admin/sync`, `/admin/audit`, `/admin/settings` (Team tab) — `admin` only
- `AdminSidebar` filters items based on role.
- `admin-impersonate` edge function: replace `is_admin` check with `can_impersonate` check.
- `admin-set-user-active` and subscription mutation functions: gate by appropriate role.

### 5. Files

**New**

- `src/pages/AdminSettings.tsx`
- `src/components/admin/AdminUserMenu.tsx`
- `src/components/admin/settings/ProfileTab.tsx`
- `src/components/admin/settings/AccountTab.tsx`
- `src/components/admin/settings/SecurityTab.tsx`
- `src/components/admin/settings/TeamTab.tsx`
- `src/hooks/useAdminRole.tsx`
- `src/hooks/useAdminTeam.tsx`
- `supabase/functions/admin-team-invite/index.ts`
- `supabase/functions/admin-team-update-role/index.ts`
- `supabase/functions/admin-team-remove/index.ts`
- Migration: enum values + helper functions + RPCs

**Edited**

- `src/App.tsx` (add route)
- `src/components/admin/AdminSidebar.tsx` (Settings link + role filtering)
- `src/components/admin/AdminLayout.tsx` (header user menu)
- `src/components/auth/AdminRoute.tsx` (`requiredRole` prop)
- `src/hooks/useIsAdmin.tsx` (use `has_admin_access`)
- `src/pages/AdminWorkspaces.tsx` (gate impersonate button)
- `supabase/functions/admin-impersonate/index.ts` (use `can_impersonate`)
- `supabase/config.toml` (register new functions)

### Open questions

1. **Email change flow** — require email confirmation (Supabase default, safer) or instant change via service role? Default: require confirmation.
2. **Team invites** — send Supabase invite email to brand-new users, or require them to sign up first then grant role? Default: invite email if user doesn't exist.
3. **Superadmin role naming** — keep `admin` as the superadmin label in the UI, or rename to "Superadmin"? Default: "Superadmin" in UI, `admin` in DB.