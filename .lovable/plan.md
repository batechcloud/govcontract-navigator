## Goal
Personalize the admin overview with a welcome message and make every KPI/stat card on the page clickable so it routes to the relevant admin section.

## Changes to `src/pages/AdminOverview.tsx`

1. **Welcome header** — Pull current admin profile (first name / email) via the existing `useAuth` hook + `profiles` query (already used in admin settings). Replace the static "Overview" title with:
   - `Welcome back, {firstName || email}` as the H1
   - Keep the existing subtitle ("Platform health, growth, and operations at a glance.")
   - Show the current date on the right for context

2. **Make KPI cards clickable** — Extend the `Kpi` component with an optional `onClick` (and `href`) prop. Render as a button-like card with hover state (`hover:border-primary/40 hover:bg-card/80 cursor-pointer transition`). Wire each KPI:
   - MRR → `/admin/subscriptions`
   - Total users → `/admin/users`
   - Workspaces → `/admin/workspaces`
   - Signups (30d) → `/admin/users`
   - Active subscriptions → `/admin/subscriptions`
   - Cancellations (30d) → `/admin/subscriptions`
   - Open support → `/admin/support`
   - Failed sync records → `/admin/sync`

3. **System health rows** — Make each `HealthRow` clickable to its source:
   - Last SAM sync / Failed records → `/admin/sync`
   - Open support threads → `/admin/support`
   - Suspended users → `/admin/users`

4. **List rows** — Make each row in *Recent signups*, *Top workspaces*, and *Latest activity* clickable:
   - Signup row → `/admin/users` (filter not required; just navigate)
   - Workspace row → `/admin/workspaces`
   - Audit row → `/admin/audit`
   The existing "View all" footer buttons remain.

## Out of scope
No backend or data changes; this is purely a UI/UX enhancement on the overview page.