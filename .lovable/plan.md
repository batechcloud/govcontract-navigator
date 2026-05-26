# Admin Impersonation

Goal: from `/admin/workspaces`, an admin clicks **Impersonate** on any workspace row, lands on that owner's `/dashboard` with full read/write context, and can return to admin with one click. Every impersonation is auditable.

## Approach

Use Supabase Admin API (`generateLink` + magic link consumption) inside an edge function to mint a real session for the target user. Admin's original session is stashed in `sessionStorage` so we can restore it on exit.

```text
[Admin] click Impersonate
   │
   ▼
edge fn: admin-impersonate (verifies is_admin, audits, mints session for target)
   │
   ▼
client: stash current admin tokens → supabase.auth.setSession(targetTokens)
   │
   ▼
Redirect to /dashboard with global ImpersonationBanner
   │
   ▼
click "Exit impersonation" → restore admin tokens → /admin/workspaces
```

## Backend

**New edge function `supabase/functions/admin-impersonate/index.ts`**
- Manual JWT verify of caller; require `is_admin(caller.id) = true`.
- Input (Zod): `{ target_user_id: uuid }`.
- Reject if target is also admin (no admin-on-admin impersonation).
- Use `supabase.auth.admin.generateLink({ type: 'magiclink', email: target.email })`, extract `hashed_token`, then call `verifyOtp({ type: 'magiclink', token_hash })` server-side to get `{ access_token, refresh_token }`.
- Insert row into `sync_audit_log` with action `admin.impersonate.start`, details `{ target_user_id, target_email, ip, ua }`.
- Return `{ access_token, refresh_token, target: { id, email, first_name, last_name } }`.
- Registered in `supabase/config.toml` with `verify_jwt = false` (manual check inside).

**New edge function `supabase/functions/admin-impersonate-end/index.ts`**
- Caller is the impersonated user; body carries `original_admin_id`.
- Verifies via `sync_audit_log` that an active impersonation start exists for that pair in the last 8h.
- Writes `admin.impersonate.end` audit row. (No token work — client restores stashed admin tokens.)

No DB migration required (audit log + `admin_emails` already exist).

## Frontend

**New `src/lib/impersonation.ts`**
- `IMPERSONATION_KEY = "gcn.impersonation"` in `sessionStorage`.
- Shape: `{ adminAccessToken, adminRefreshToken, adminUserId, adminEmail, targetUserId, targetEmail, startedAt }`.
- Helpers: `getImpersonation()`, `isImpersonating()`, `startImpersonation(targetId)`, `endImpersonation()`.
- `startImpersonation`: read current session, invoke `admin-impersonate`, stash admin tokens, `supabase.auth.setSession(target tokens)`, `queryClient.clear()`, navigate `/dashboard`.
- `endImpersonation`: invoke `admin-impersonate-end`, `supabase.auth.setSession(admin tokens)`, clear storage, `queryClient.clear()`, navigate `/admin/workspaces`.

**New `src/components/impersonation/ImpersonationBanner.tsx`**
- Fixed top banner (amber/destructive tokens), shown app-wide whenever `isImpersonating()`.
- Text: "Viewing as {targetEmail} — actions are real". Button: **Exit impersonation**.
- Mounted once in `src/App.tsx` above `<Routes>`.

**`src/pages/AdminWorkspaces.tsx`**
- Add **Impersonate** button per row (uses existing `useAdminWorkspaces` data → `owner_id`, `owner_email`).
- Confirm dialog: "Impersonate {owner_email}? All actions will be performed as this user and logged."
- On confirm → `startImpersonation(owner_id)`.

**`src/components/auth/AdminRoute.tsx`**
- If `isImpersonating()` → redirect to `/dashboard` (admin guard must not engage while impersonating).

**`src/hooks/useIsAdmin.tsx`**
- Force-return `false` when `isImpersonating()` so admin UI never leaks into the target's view.

## Security

- Only callers where `is_admin(auth.uid())` passes can invoke `admin-impersonate`; double-checked server-side.
- Cannot impersonate another admin.
- Every start/end is written to `sync_audit_log` (already admin-readable).
- Tokens minted have normal Supabase session lifetime; sessionStorage (not localStorage) so they die with the tab.
- Banner is non-dismissible; exit button is always one click.

## Out of scope

- Read-only impersonation mode.
- Time-boxed auto-exit timer (can add later; audit log already records start).
- Impersonating users without an email (shouldn't exist in this project).

## Files

**Create:** `supabase/functions/admin-impersonate/index.ts`, `supabase/functions/admin-impersonate-end/index.ts`, `src/lib/impersonation.ts`, `src/components/impersonation/ImpersonationBanner.tsx`
**Edit:** `supabase/config.toml`, `src/App.tsx`, `src/pages/AdminWorkspaces.tsx`, `src/components/auth/AdminRoute.tsx`, `src/hooks/useIsAdmin.tsx`, `mem://index.md` + new `mem://features/admin-impersonation`
