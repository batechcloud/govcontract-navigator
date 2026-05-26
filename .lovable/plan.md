## Admin Dashboard Audit Report

Scope: `/admin`, `/admin/workspaces`, `/admin/users`, `/admin/subscriptions`, `/admin/support`, `/admin/sync` (+ job detail), `/admin/audit`, `/admin/settings` (+ login). I read each page, traced every `supabase.rpc()` / `functions.invoke()` call, and verified every RPC and edge function exists with the right signature and permissions.

---

### ✅ What works correctly

- **AdminOverview** — 8 KPI cards all navigate to the right section; signups chart, system health, top workspaces, latest activity all clickable; welcome message renders with profile name + fallback to email.
- **AdminWorkspaces** — list, search, status filter, suspend/reactivate, impersonate, and detail drawer (members + counts + activity + role changes + removal) all wired to existing RPCs/functions.
- **AdminSync** — start full / incremental, cancel, retry failed, live progress with ETA, recent jobs table → job detail page. All `sam-sync-control` actions exist.
- **AdminAudit** — pulls last 30d from `sync_audit_log` (RLS-protected to admins), charts and recent-events list work.
- **AdminSupport** — thread list, filters, conversation pane, status changes, composer; all hooks in `useSupportChat` resolve.
- **AdminSubscriptions** — read-only list + MRR/Active/Churned KPIs.
- **AdminUsers** — search, status filter, suspend/reactivate.
- **AdminSettings** — Profile / Account / Security tabs for everyone; Team tab gated to superadmin; invite / role-change / remove all hit existing edge functions.
- **AdminLogin** — sign-in, allowlist re-check, audit logging, invite flow all good.

---

### 🐞 Bugs (functional)

1. **Overview "Recent signups" only ever shows the logged-in admin.**
   `useAdminRecentSignups` queries `profiles` directly, but `profiles` RLS is `auth.uid() = id`, so admins can only read their own row. Needs a `SECURITY DEFINER` RPC (e.g. `admin_recent_signups(_limit int)`) gated by `is_admin(auth.uid())`.

2. **Suspending a user from AdminUsers doesn't refresh the table.**
   `useSetUserActive` invalidates `admin-workspaces` and `admin-workspace-members` only. Missing invalidations for `admin-users` and `admin-overview-stats` — the Users row keeps showing "Active" until a manual reload.

3. **AdminLogin always redirects to `/admin/sync` after sign-in.**
   `/admin/sync` is restricted to superadmin (`role: ["admin"]` in sidebar, `allowedRoles={[]}` on the route). `workspace_admin` and `subscription_manager` sign in successfully, hit `/admin/sync`, get bounced by `AdminRoute` to `/admin`. Should send them to `/admin` directly.

4. **AdminAudit "Back to console" button points at `/admin/sync`.**
   Same issue as #3 — works for superadmin, wrong destination conceptually. Should go to `/admin`.

5. **AdminSync non-admin redirect points to `/dashboard`** instead of `/admin/login` (every other admin page redirects to `/admin/login`). Inconsistent, can confuse non-authed users.

---

### ✨ Polish (consistency / UX)

6. **AdminUsers has no Impersonate / Details actions** — AdminWorkspaces does. Adding Impersonate per row would let admins jump into any user's account, not just workspace owners.
7. **AdminWorkspaces & AdminUsers RPCs hide deleted/orphaned rows silently** — `admin_list_workspaces` LEFT JOINs `auth.users`; if owner email is null the row renders "—". Cosmetic, not a bug.
8. **AdminSync `Navigate to="/dashboard"`** could be `/admin/login` to match the rest.

---

### Proposed fix plan (in order)

If you approve, I'll do them as one focused pass:

1. **DB migration** — add `admin_recent_signups(_limit int)` security-definer RPC; update `useAdminRecentSignups` to call it.
2. **Hook fix** — extend `useSetUserActive` to invalidate `admin-users` and `admin-overview-stats`.
3. **Routing fixes** — AdminLogin success → `/admin`; AdminAudit back button → `/admin`; AdminSync unauthorized → `/admin/login`.
4. **(Optional UX)** — Add Impersonate + open-detail to AdminUsers rows (mirrors AdminWorkspaces).

Tell me which of these to ship — say "all 4", "just 1–3", or pick individually.