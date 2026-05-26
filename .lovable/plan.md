# Superadmin Console Redesign

Right now the admin pages (Sync, Workspaces, Support, Audit) each render their own row of header buttons to jump between sections. That's clunky and there is no real "dashboard" — just operational tools. This plan introduces a proper admin shell with a persistent sidebar and a new overview page packed with SaaS KPIs.

## 1. New admin shell

**`src/components/admin/AdminLayout.tsx`** — wraps every `/admin/*` page (except `/admin/login`).

- Persistent left sidebar (shadcn `Sidebar`, `collapsible="icon"`) with a top "Admin Console" brand and a sign-out button at the bottom.
- Nav items (icon + label, active state via `NavLink`):
  - **Overview** → `/admin` (new)
  - **Workspaces** → `/admin/workspaces`
  - **Users** → `/admin/users` (new — see §3)
  - **Subscriptions** → `/admin/subscriptions` (new — see §3)
  - **Support** → `/admin/support` (with unread badge from `support_threads.unread_for_admin`)
  - **Sync** → `/admin/sync`
  - **Audit Log** → `/admin/audit`
- Top header: page title slot, "Back to app" link, current admin email.
- Remove the inline "navigate to other admin pages" button rows from `AdminSync`, `AdminWorkspaces`, `AdminAudit`, `AdminSupport`.

## 2. Overview dashboard (`/admin`)

New page `src/pages/AdminOverview.tsx`. Lays out the standard SaaS admin metrics in a bento-style grid.

**KPI cards (top row, with delta vs. previous period):**
- Total workspaces
- Total users (active / suspended split)
- Active paid subscriptions
- MRR estimate (sum of `subscription_plans.monthly_price` for active subs)
- Signups today / this week / this month
- Cancellations this month (subs that flipped to `cancelled` / `inactive`)
- Open support threads

**Charts (Recharts):**
- Signups over time — area chart, last 30/90 days (toggle).
- Plan distribution — donut (Starter vs Pro vs Enterprise vs trial).
- Workspace growth — line chart of cumulative workspaces.
- Daily active users — bar chart using `profiles.last_active_at`.

**Tables:**
- Recent signups (last 10 with email, plan, signup date).
- Recent cancellations (last 10).
- Top workspaces by member count.
- Latest audit-log entries (last 8, link to full log).

**System health strip (bottom):**
- Last SAM sync time + status (reuses `sync_metadata` + last `sync_jobs`).
- Failed sync records count.
- API rate-limit usage today (sum from `api_rate_limits` for today).

## 3. New pages added to sidebar

- **`/admin/users` (`AdminUsers.tsx`)** — flat list of every authenticated user (not just owners): email, name, plan, workspace, role, suspended status, last active, signup date. Search + filter. Suspend/reactivate buttons (reuse `admin-set-user-active`).
- **`/admin/subscriptions` (`AdminSubscriptions.tsx`)** — table of `user_subscriptions` joined with plan + owner: status, plan, period start/end, MRR. Filter by status; basic counters at the top.

These are scaffolded with the same RPC pattern as workspaces; full edit-billing is out of scope (read-only + suspend only, matches existing decisions).

## 4. Backend additions

One migration adds three SECURITY DEFINER RPCs (admin-only, `search_path = public`):

- **`admin_overview_stats()`** → single row of all KPI counts (workspaces, users, suspended_users, active_subs, mrr_cents, signups_today/7d/30d, cancellations_30d, open_support_threads, failed_sync_records, last_sync_at).
- **`admin_signups_timeseries(_days int)`** → date + count of new profiles per day.
- **`admin_list_users()`** → row per user with email, plan, workspace, role, suspended, last_active_at, created_at.
- **`admin_list_subscriptions()`** → row per subscription with owner email, plan name, status, prices, period dates.

All four use `WHERE public.is_admin(auth.uid())` so non-admins get an empty set.

## 5. Frontend hooks

`src/hooks/useAdminOverview.tsx` — `useAdminOverviewStats()`, `useAdminSignupsTimeseries(days)`, `useAdminRecentSignups()`, `useAdminRecentCancellations()` (the last two are thin Supabase selects on `profiles` / `user_subscriptions`).

`src/hooks/useAdminUsers.tsx` and `useAdminSubscriptions.tsx` for the new pages.

All use React Query, 60s stale time, surfaced through the AdminLayout shell.

## 6. Routing

Update `src/App.tsx`:

```text
/admin                → <AdminLayout><AdminOverview/></AdminLayout>
/admin/workspaces     → <AdminLayout><AdminWorkspaces/></AdminLayout>
/admin/users          → <AdminLayout><AdminUsers/></AdminLayout>
/admin/subscriptions  → <AdminLayout><AdminSubscriptions/></AdminLayout>
/admin/support        → <AdminLayout><AdminSupport/></AdminLayout>
/admin/sync           → <AdminLayout><AdminSync/></AdminLayout>
/admin/sync/jobs/:id  → <AdminLayout><AdminSyncJobDetail/></AdminLayout>
/admin/audit          → <AdminLayout><AdminAudit/></AdminLayout>
/admin/login          → <AdminLogin/>   (unchanged, no shell)
```

Each admin page stops rendering `DashboardLayout` and the inline cross-nav buttons.

## 7. Design

Same dark glassmorphic system already used elsewhere (`bg-card/40`, `border-border/50`, Montserrat headings). Sidebar uses the existing primary accent (`#4A5BA8`). No new tokens needed.

## Out of scope

- Editing plans/prices.
- Manual subscription state changes (will only display).
- Real-time updates (React Query refetch on focus + 60s polling for KPIs).
- Per-user impersonation.

## Files

**Create**
- `supabase/migrations/<ts>_admin_console.sql` — 4 RPCs above.
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/pages/AdminOverview.tsx`
- `src/pages/AdminUsers.tsx`
- `src/pages/AdminSubscriptions.tsx`
- `src/hooks/useAdminOverview.tsx`
- `src/hooks/useAdminUsers.tsx`
- `src/hooks/useAdminSubscriptions.tsx`

**Edit**
- `src/App.tsx` — wrap admin routes in `AdminLayout`, add 3 new routes.
- `src/pages/AdminSync.tsx`, `AdminWorkspaces.tsx`, `AdminSupport.tsx`, `AdminAudit.tsx` — drop `DashboardLayout` and the cross-nav button rows.
- `mem://index.md` + new `mem://features/admin-console`.

Approve and I'll build it.
