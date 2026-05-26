## Add Viewer/Editor roles to workspace invites

Extend the existing Workspace model so invited users get a role of **Viewer** (read-only) or **Editor** (read/write), while the original creator remains **Owner**. Owners keep exclusive rights to invite and remove members.

### 1. Database (single migration)

- Extend the `workspace_role` enum: add `viewer` and `editor` values (keep existing `owner`, `member` for backward compatibility; treat legacy `member` as `editor` at read time).
- Add helper security-definer functions:
  - `is_workspace_editor()` → true if current user is `owner` or `editor` in their workspace.
  - `is_workspace_viewer_or_above()` → true for any membership (used by SELECT policies).
- Update RLS on shared tables (`tracked_contracts`, `proposals`, `saved_searches`, `company_profiles`):
  - **SELECT** — any workspace member (viewer included), via `same_workspace_as(user_id)`.
  - **INSERT / UPDATE / DELETE** — only `owner` or `editor` of the same workspace. Viewers blocked.
- Backfill: any existing `member` row → `editor` (preserves current behavior for already-invited users).

### 2. Edge functions

- **`workspace-invite-user`** — accept new `role` field in body, validated as `'viewer' | 'editor'` (default `'viewer'`). Owner-only caller check unchanged. Insert `workspace_members` row with the chosen role.
- **`workspace-remove-user`** — unchanged (owner-only, hard delete).
- Owner role cannot be assigned via invite; only the workspace creator is owner.

### 3. Frontend — `src/components/settings/UsersTab.tsx`

- **Invite dialog**: add a Role selector (Viewer / Editor) with short helper text for each:
  - Viewer — "Can see contracts, proposals, saved searches. Cannot make changes."
  - Editor — "Full access to create, edit, and delete shared workspace data."
- **Roster table**: show role badge with three styles (Owner / Editor / Viewer). Add an inline role switcher (dropdown) for owner to change a member between Viewer ↔ Editor. Owner row is locked.
- **Remove button**: owner-only, unchanged.
- Add a small `useWorkspacePermissions` derivation in `useWorkspace.tsx` exposing `isOwner`, `isEditor`, `isViewer`, `canEdit` for use elsewhere.

### 4. Frontend write-path gating (light touch)

- Use `canEdit` from `useWorkspacePermissions` to disable obvious write controls for viewers (Save contract button, Create proposal, Save search, Edit company profile). DB RLS is the source of truth; UI gating just avoids confusing errors.
- Show a single tooltip on disabled controls: "Read-only access — ask your workspace owner for editor access."

### 5. New edge function — `workspace-update-role`

- Owner-only. Input: `{ user_id, role: 'viewer' | 'editor' }`. Validates target is in caller's workspace and not the owner. Updates `workspace_members.role`. Audit log entry.

### Out of scope

- No per-resource permissions (everything is workspace-wide).
- No transfer-ownership flow.
- No invite emails (still temp-password flow).
- No new "admin" tier between owner and editor.

### Files

- New migration (enum values, helper fns, RLS rewrites, backfill).
- New edge function `supabase/functions/workspace-update-role/index.ts`.
- Edit `supabase/functions/workspace-invite-user/index.ts` (accept role).
- Edit `supabase/config.toml` (register new function).
- Edit `src/hooks/useWorkspace.tsx` (expose permissions).
- Edit `src/components/settings/UsersTab.tsx` (role selector + inline switcher).
- Optional: wire `canEdit` into a few primary write actions (TrackContract button, Create Proposal button, Save Search button).
