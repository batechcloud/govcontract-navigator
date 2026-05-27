## Root cause

Both workspace owners that have tested support chat (`batechcloud@gmail.com`, `superadmin.test@gcnavigator.dev`) are also listed in `admin_emails`, so `is_admin(auth.uid())` returns **true** for them.

The `support_threads` SELECT RLS is `workspace_id = my_workspace_id() OR is_admin(auth.uid())`, so these users can see **all** support threads (currently 2 rows).

`useSupportUnreadCount` does:
```ts
supabase.from("support_threads").select("unread_for_workspace").maybeSingle()
```
`maybeSingle()` rejects when more than one row matches, so the query silently errors → `data` is `undefined` → the hook returns `0` → the red bell badge never lights up, even though the trigger correctly bumps `unread_for_workspace`.

The same pattern exists in `useMyWorkspaceSupportThread`, which fetches the thread row by `.eq("id", tid)` — that one is safe.

## Fix

Scope the workspace unread query to the caller's own workspace thread instead of relying on RLS narrowing.

### `src/hooks/useSupportChat.tsx` — `useSupportUnreadCount`

Replace the `.maybeSingle()` query with a query filtered by the workspace's thread:

1. Use `useWorkspace()` to get `workspace.id` (already used elsewhere in the app).
2. Query `support_threads.unread_for_workspace` with `.eq("workspace_id", workspace.id).maybeSingle()`.
3. Disable the query until `workspace?.id` is available.

This guarantees at most one row regardless of admin status and fixes the silent error.

### Verification

- Open dashboard as an admin-flagged workspace owner; trigger an admin reply from `/admin/support`; within 30 s the bell should show a red badge with the count.
- Open the support panel: badge clears to 0, `unread_for_workspace` resets in DB (existing `useMarkSupportRead` behavior).
- Non-admin workspace users: behavior unchanged.

No DB / migration / RLS changes required — purely a client-side query fix.