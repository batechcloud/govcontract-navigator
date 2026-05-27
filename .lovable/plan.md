## Goal
When a workspace user posts a support message, all admins get notified. When an admin replies, the workspace owner gets notified. Notifications are in-app (badge + toast + soft chime) plus an email fallback if the recipient hasn't opened the chat within 5 minutes.

## 1. In-app notifications (polling, ~30s)

**Workspace side (DashboardLayout)**
- Add a small `useSupportNotifier()` hook mounted in `DashboardLayout`.
- It reuses `useSupportUnreadCount()` and tracks the previous `unread_for_workspace`. When it increases, fire `toast.info("New reply from support", { action: open SupportChatPanel })` and play a short chime (`new Audio()` with a tiny base64 ping, muted on first load until the user has interacted).
- The existing unread badge on the support sidebar entry already shows the count — keep it.

**Admin side (AdminLayout)**
- Same pattern using `useAdminSupportUnread()`. On increase → toast linking to `/admin/support`.
- Add an unread badge next to the "Support" item in `AdminSidebar` (mirrors what the workspace sidebar already does).

No backend changes required — `unread_for_workspace` / `unread_for_admin` are already maintained by the `support_message_after_insert` trigger.

## 2. Email fallback (after 5 min of inactivity)

Lovable Emails infrastructure (setup_email_infra + scaffold_transactional_email + verified domain) is **required**. The user will need to complete the email domain setup dialog once; the rest is automatic.

**New table** `support_notification_jobs`
- `thread_id`, `message_id`, `recipient_type` ('workspace' | 'admin'), `recipient_email`, `scheduled_for` (now() + 5 min), `sent_at`, `cancelled_at`.
- RLS: service_role only.

**Trigger** extends `support_message_after_insert`:
- When sender_type = 'workspace' → enqueue one job per admin email (from `admin_emails` + `user_roles` admins) scheduled 5 min out.
- When sender_type = 'admin' → enqueue one job for the workspace owner's email scheduled 5 min out.

**`useMarkSupportRead`** also calls a new RPC `cancel_pending_support_notifications(thread_id, recipient_type)` that sets `cancelled_at = now()` on any unsent jobs for that side — if the recipient opens the chat within 5 min, no email goes out.

**Edge function** `send-support-notifications` (cron every 1 min):
- Selects jobs where `scheduled_for <= now() AND sent_at IS NULL AND cancelled_at IS NULL`.
- For each, re-verifies the thread is still unread for that side; if read, marks cancelled.
- Otherwise calls `send-transactional-email` with template `support-new-message` and idempotency key `support-${message_id}-${recipient_email}`.

**Template** `support-new-message.tsx`:
- Subject: "New support message from {workspaceName}" (admin) / "New reply from GC Navigator support" (workspace).
- Body: preview of last message + CTA button linking to `/admin/support?thread=…` or `/dashboard?support=1`.

## 3. Files

**New**
- `src/hooks/useSupportNotifier.tsx`
- `supabase/functions/send-support-notifications/index.ts`
- `supabase/functions/_shared/transactional-email-templates/support-new-message.tsx`

**Edited**
- `src/components/dashboard/DashboardLayout.tsx` — mount notifier
- `src/components/admin/AdminLayout.tsx` — mount notifier + badge
- `src/components/admin/AdminSidebar.tsx` — unread badge on Support item
- `src/hooks/useSupportChat.tsx` — call `cancel_pending_support_notifications` inside `useMarkSupportRead`
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template

**Migration**
- Create `support_notification_jobs` table + grants + RLS
- Replace `support_message_after_insert` to also enqueue jobs
- Add `cancel_pending_support_notifications(_thread_id uuid, _recipient_type text)` RPC
- Schedule pg_cron to invoke `send-support-notifications` every minute

## 4. Prerequisites the user must complete
- Approve the Lovable Emails setup dialog (verifies a sending subdomain). The migration + edge functions will be created automatically; emails activate once DNS verifies.

If you only want the in-app piece for now, I can ship Phase 1 (sections 1) alone and defer the email pipeline until the domain is ready — just say the word.
