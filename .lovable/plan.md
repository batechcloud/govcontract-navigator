## Workspace detail view for admins

Add a "View details" action on each workspace row in `/admin/workspaces` that opens a full-height side drawer (Sheet) with richer account info and per-member actions. Keep the existing inline expand/suspend/impersonate row controls untouched.

### What the drawer shows

**Header**
- Workspace name, plan badge, status badge (Active / Suspended)
- Owner name, email, avatar initials
- Quick actions: Impersonate owner, Suspend / Reactivate owner, Open support thread

**Overview cards**
- Created on (full date + relative)
- Owner signed up (from `auth.users.created_at` of owner)
- Owner last active (from `profiles.last_active_at`)
- Member count + breakdown by role (owner / editor / viewer)
- Plan name, subscription status, current period end (from `user_subscriptions` + `subscription_plans`)
- Usage snapshot: # tracked contracts, # saved searches, # proposals (counts only)

**Members table**
- Columns: Name, Email, Role, Joined, Last active, Status
- Per-row actions (owner-of-workspace excluded from destructive ones):
  - Change role: viewer ↔ editor (reuse existing `workspace-update-role` edge function path is owner-only; we'll add an admin-side action via existing `admin-set-user-active` for suspend, and a new admin RPC for role change — see Technical)
  - Suspend / Reactivate member (reuses `admin-set-user-active`)
  - Impersonate member (reuses `startImpersonation`)
  - Remove from workspace (new admin action)

**Recent activity**
- Last 10 entries from `sync_audit_log` filtered by `details->>'workspace_id' = <id>` OR `actor_id` in workspace members.

### How to open it

- New "Details" button on each workspace row (between Impersonate and Suspend), and clicking the workspace name also opens the drawer.
- Drawer state via local `useState<AdminWorkspaceRow | null>`; uses shadcn `Sheet` (right side, `sm:max-w-2xl`).

### Technical

New hook `useAdminWorkspaceDetail(workspaceId)` calls a new SECURITY DEFINER RPC `admin_workspace_detail(_workspace_id uuid)` returning a single JSON row with:
- owner signup date, last active
- subscription { plan, status, period_end }
- counts { tracked_contracts, saved_searches, proposals }
- role breakdown

Reuse existing `admin_list_workspace_members` for member rows (already returns joined_at, is_suspended, role). Add `last_active_at` to its return.

New edge functions (admin-only, manual JWT verify, follow existing pattern in `admin-team-*`):
- `admin-workspace-set-member-role` — body `{ workspace_id, user_id, role }`, updates `workspace_members.role`, blocks changing owner.
- `admin-workspace-remove-member` — body `{ workspace_id, user_id }`, deletes from `workspace_members`, blocks removing owner.

Recent activity: client-side query `sync_audit_log.select().or('actor_id.in.(...)','details->>workspace_id.eq.<id>').order(created_at desc).limit(10)`.

### Files

- New: `src/components/admin/WorkspaceDetailDrawer.tsx`
- New: `src/hooks/useAdminWorkspaceDetail.tsx`
- Edit: `src/pages/AdminWorkspaces.tsx` (add Details button + drawer mount, make workspace name clickable)
- Edit: `src/hooks/useAdminWorkspaces.tsx` (add `last_active_at` to member type; add member-role / remove mutations)
- New SQL migration: `admin_workspace_detail` RPC + add `last_active_at` to `admin_list_workspace_members`
- New edge functions: `admin-workspace-set-member-role`, `admin-workspace-remove-member` (+ `supabase/config.toml` entries)

### Out of scope

- Editing workspace name / plan
- Billing changes (stay in `/admin/subscriptions`)
- Inviting new members from the admin drawer (owners do this from their workspace settings)
