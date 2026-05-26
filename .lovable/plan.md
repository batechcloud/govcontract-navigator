## Add Support Chat (workspace ↔ support team)

A shared support thread per workspace. Owner and all members can post; superadmins reply from a new Admin Support Inbox page. Polls every 30s. Image/PDF attachments supported.

### 1. Database (single migration)

- **`support_threads`** — one row per workspace.
  - `id`, `workspace_id` (unique), `subject` (default "Workspace support"), `status` ('open' | 'pending' | 'resolved'), `last_message_at`, `last_message_preview`, `unread_for_workspace` int, `unread_for_admin` int, timestamps.
- **`support_messages`** — chronological messages.
  - `id`, `thread_id`, `sender_id` (auth user id), `sender_type` ('workspace' | 'admin' | 'system'), `body` text, `attachments` jsonb (array of `{ path, name, mime, size }`), `created_at`.
- Indexes on `support_messages(thread_id, created_at)` and `support_threads(workspace_id)`, `support_threads(status, last_message_at desc)`.
- **GRANTs** for `authenticated` and `service_role` on both tables.
- **RLS**
  - Threads: workspace members SELECT/UPDATE their own thread (via `same_workspace_as` on `owner_id` lookup or direct workspace_id check using `my_workspace_id()`); admins (`is_admin(auth.uid())`) SELECT/UPDATE all.
  - Messages: workspace members SELECT messages whose thread belongs to their workspace; INSERT allowed with `sender_id = auth.uid()` and `sender_type = 'workspace'`. Admins SELECT all and INSERT with `sender_type = 'admin'`.
- Trigger on `support_messages` insert: update parent thread's `last_message_at`, `last_message_preview`, increment the opposite-side unread counter, set status to `open` when a workspace user posts.
- Helper `get_or_create_support_thread(_workspace_id uuid)` SECURITY DEFINER returning the thread id, used by the client on first open.

### 2. Storage

- New private bucket `support-attachments`.
- RLS on `storage.objects`:
  - Workspace members upload/read files prefixed `workspace/<workspace_id>/...`.
  - Admins read all under the bucket.
- 10MB per file limit enforced client-side. Allowed mimes: `image/*`, `application/pdf`.

### 3. Edge functions

None required for v1 — all reads/writes go through Supabase client + RLS. Trigger handles thread bookkeeping.

### 4. Frontend — workspace side

- **`src/hooks/useSupportThread.tsx`**
  - `useSupportThread()` — RPC `get_or_create_support_thread`, then `useQuery` for thread row.
  - `useSupportMessages(threadId)` — message list, `refetchInterval: 30_000` while visible.
  - `useSendSupportMessage()` — upload attachments to storage, then insert message row.
- **`src/components/support/SupportChatPanel.tsx`** — Sheet/drawer with header (subject, status badge, "Typical reply within 24h" microcopy), scrollable message list, input area with file attach + send button. Uses AI Elements–style bubbles (own = right-aligned filled, admin = left-aligned subtle surface, system = centered muted). Auto-scroll to bottom on new messages.
- **Sidebar entry** — add a "Support" item near the bottom of the main sidebar (icon: `LifeBuoy`) with an unread dot when `unread_for_workspace > 0`. Clicking opens the Sheet panel (not a route). Visible to every workspace member (owner + editor + viewer).
- Mark thread read: when the panel opens, reset `unread_for_workspace = 0`.

### 5. Frontend — admin side

- **`src/pages/admin/SupportInbox.tsx`** (new) under `AdminRoute` at `/admin/support`.
  - Left column: list of all threads, ordered by `last_message_at desc`. Each row: workspace name, last preview, time ago, unread badge, status pill, filter chips (Open / Pending / Resolved / All), search.
  - Right column: selected thread conversation reusing `SupportMessageList` + admin composer. Status dropdown (Open / Pending / Resolved). On open, reset `unread_for_admin = 0`.
- Add **Support** link to the admin sidebar.

### 6. Polling & sidebar badge

- Lightweight workspace-side hook `useSupportUnreadCount()` that queries `support_threads.unread_for_workspace` for the workspace every 30s; drives the sidebar dot.
- Admin sidebar gets a parallel `useAdminSupportUnreadCount()` summing `unread_for_admin` across open threads.

### Out of scope

- No realtime subscriptions (poll only).
- No email notifications.
- No typing indicators, read receipts, reactions.
- No per-message editing/deletion.
- No file types beyond images and PDFs.
- No SLAs / business-hours logic — UI just shows "Typical reply within 24h" microcopy.

### Files to create

- Migration (tables, indexes, RLS, trigger, helper RPC, bucket + storage policies).
- `src/hooks/useSupportThread.tsx`
- `src/components/support/SupportChatPanel.tsx`
- `src/components/support/SupportMessageList.tsx`
- `src/components/support/SupportComposer.tsx`
- `src/pages/admin/SupportInbox.tsx`

### Files to edit

- Main sidebar component (add Support item + unread dot)
- Admin sidebar component (add Support link)
- `src/App.tsx` (lazy route `/admin/support`)
- Memory index (new `mem://features/support-chat` entry)
