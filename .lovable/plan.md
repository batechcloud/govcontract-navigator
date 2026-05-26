## Goal
Add a **Workspace / Team** model so each account owner can invite teammates from Settings → Users, set them a temporary password, and hard-delete them when needed.

## Scope note (important)
The app today is single-tenant per user — every per-user table (`tracked_contracts`, `proposals`, `saved_searches`, `company_profiles`, `chat_conversations`, `chat_messages`, `user_documents`, `tracked_competitors`, `competitor_awards`, `win_loss_records`, `cached_contracts`) is scoped by `user_id = auth.uid()`. A true workspace model means teammates see the **owner's** data, which requires changing RLS across all of those tables.

To keep the change tractable and reversible, the plan introduces workspaces but keeps data scoping changes minimal in v1: members get their **own** private workspace data plus visibility into the **owner's** shared data (tracked contracts, proposals, saved searches, company profile). Chat, documents, and competitors stay private per user. We can widen sharing later.

## Database changes (single migration)

1. **`workspaces`** — `id`, `owner_id` (auth user), `name`, timestamps.
2. **`workspace_members`** — `workspace_id`, `user_id`, `role` (`owner` | `member`), `invited_by`, `created_at`. Unique (workspace_id, user_id).
3. **`workspace_role`** enum.
4. Security-definer helpers:
   - `current_workspace_id()` — returns the workspace the calling user belongs to (owner's workspace if member, else own).
   - `is_workspace_owner(uuid)` — true if `auth.uid()` is owner of given workspace.
   - `is_workspace_member(uuid)` — true if `auth.uid()` is owner or member.
5. **Backfill**: create one workspace per existing auth user, owner = that user.
6. **Trigger** on `auth.users` insert (extend `handle_new_user`) to create a workspace + owner membership for every new signup.
7. **Shared-data RLS update** on `tracked_contracts`, `proposals`, `saved_searches`, `company_profiles`:
   - Replace `auth.uid() = user_id` with `is_workspace_member((select owner_id from workspaces w join workspace_members m on m.workspace_id = w.id where m.user_id = <row.user_id> and m.role='owner'))` — i.e. any member of the row owner's workspace can read/write. Implemented via a `row_in_my_workspace(user_id)` security-definer helper to keep policies clean.
8. RLS on workspaces/members:
   - Members can `SELECT` their own workspace + member list.
   - Only `owner` can `INSERT`/`DELETE` members.
   - `service_role` full access (edge functions).
9. GRANTs to `authenticated` + `service_role` for the new tables.

## Edge functions

1. **`workspace-invite-user`** (new)
   - Auth: manual JWT verify; caller must be `owner` of the workspace.
   - Input (zod): `{ email, first_name?, last_name?, temp_password }` — password ≥ 12 chars, must contain upper/lower/digit/symbol.
   - Uses `service_role` to `auth.admin.createUser({ email, password, email_confirm: true })`.
   - Inserts a `workspace_members` row with role `member`.
   - Logs to `sync_audit_log` (`action: 'workspace_invite'`).
   - Returns the new user id + status.

2. **`workspace-remove-user`** (new)
   - Auth: caller must be `owner`; cannot remove themselves or another owner.
   - Hard-delete: `auth.admin.deleteUser(user_id)` (auth deletion cascades nothing in `public` — orphan rows stay, but the user can no longer sign in). We also delete `workspace_members`, `profiles`, `user_roles`, and any rows in per-user tables where `user_id = removed`. Done in one transactional RPC `delete_user_cascade(uuid)` (security definer) called from the function.
   - Audit log entry.

3. Both follow existing conventions: `npm:@supabase/supabase-js@2/cors`, manual JWT check, zod validation, structured JSON errors.

## Frontend changes

1. **`src/hooks/useWorkspace.tsx`** (new) — fetches current workspace + members (React Query, 5min stale).
2. **`src/hooks/useIsWorkspaceOwner.tsx`** (new) — derives from members list.
3. **Settings page** ([`src/pages/Settings.tsx`](src/pages/Settings.tsx))
   - Add a new **"Users"** tab between Account and Billing.
   - Tab visible to everyone, but invite/remove controls only render for workspace **owners**. Members see a read-only roster ("You are a member of {Owner Name}'s workspace").
   - **Roster table**: avatar, name, email, role badge (Owner/Member), joined date, remove button (owner only, disabled for self/owner).
   - **Invite dialog** (shadcn Dialog):
     - Fields: email (zod email), first name, last name, temp password + confirm.
     - Password rules surfaced inline: ≥12 chars, mixed case, digit, symbol. Generate-random button.
     - Submit → calls `workspace-invite-user`; on success toast: "User created. Share the temporary password securely — they must change it on first login."
     - Copy-password-to-clipboard button shown once after creation.
   - **Remove confirm**: AlertDialog warning "This permanently deletes the user account and all their data. This cannot be undone." → calls `workspace-remove-user`.
4. **First-login password rotation** (light touch): on dashboard mount, if `profile.notification_preferences.must_change_password === true` (set by invite function via user_metadata mirror), redirect to `/reset-password` with a banner. (Optional — flag for v1.1 if we want to skip.)

## Out of scope / explicit non-goals
- No invite emails (admin shares password out-of-band per choice).
- No workspace switching UI (each user belongs to exactly one workspace).
- No transfer-ownership flow (handled manually in DB for now).
- Chat, documents, competitor tracking stay private per user.

## Files touched
- New migration `supabase/migrations/<ts>_workspaces.sql`
- New `supabase/functions/workspace-invite-user/index.ts`
- New `supabase/functions/workspace-remove-user/index.ts`
- New `src/hooks/useWorkspace.tsx`
- Edit `src/pages/Settings.tsx` (add Users tab + dialogs)
- Edit memory index to add `mem://features/workspace-management`

## Verification
- Linter on migration; manual smoke test: create user, sign in as them, verify they see owner's tracked contracts; owner removes them, verify login fails and rows gone.
