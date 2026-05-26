# Dashboard QA — Remaining Fixes

The earlier audit covered all 10+ dashboard pages, hooks, and edge functions. Small bugs (#3 Billing card, #4 viewer read-only, #5 sector totals, #7 bell popover) are already fixed. Four bigger items remain. Here is the plan to close them out.

## 1. Block suspended users
- `ProtectedRoute` already loads `profile` via `useProfile`. Add a check: if `profile.is_suspended === true`, render a full-screen "Account suspended — contact support@" panel with a Sign out button, instead of `children`.
- Same treatment in `AdminRoute` for safety.
- No DB change needed (`profiles.is_suspended` already exists).

## 2. Write `profiles.last_active_at`
- Add a small `useTrackActivity` hook mounted once in `DashboardLayout`.
- On mount and every 5 min while the tab is visible, `update profiles set last_active_at = now() where id = auth.uid()` (throttled, fire-and-forget, no toast on error).
- Fixes empty "Last active" columns in admin overview, workspace detail, users list.

## 3. Wire feature gating into the UI
Use existing `useFeatureAccess` + `FeatureGate` / `UsageLimitBanner` (already built, never mounted) in three places:
- **AI Proposal Generator** (`ProposalGenerator.tsx`) — wrap the Generate button in `FeatureGate feature="ai_proposals"`; show `UsageLimitBanner` above the form.
- **AI Opportunity Chat** (`AIOpportunityChat.tsx`) — gate the send button on `ai_chat`.
- **Saved Searches** (`SaveSearchModal.tsx`) — block save when `saved_searches` usage_limit is reached; show banner.
- On successful action, call `useIncrementUsage` to bump the counter.

## 4. Notification preferences pipeline (report-only decision)
Persisting `notification_preferences` without an email sender is misleading. Two options — pick one:
- **(a) Hide the tab for now** until an email pipeline (Resend + cron edge function reading saved searches) is built. Fast, honest.
- **(b) Build the pipeline now**: new `send-saved-search-digest` edge function + daily `pg_cron` that respects `email_frequency` and quiet hours. Bigger scope (~half day).

I recommend **(a)** in this pass and tracking (b) as a follow-up, unless you want the full pipeline now.

## Technical notes
- All changes are additive; no schema migrations.
- `useTrackActivity` uses `document.visibilityState` to avoid pinging when tab is hidden.
- `FeatureGate` shows an upsell card linking to `/pricing` when access is denied — already implemented, just needs to be mounted.

## Files touched
- `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/AdminRoute.tsx`
- new `src/hooks/useTrackActivity.tsx`, used in `src/components/dashboard/DashboardLayout.tsx`
- `src/pages/ProposalGenerator.tsx`, `src/pages/AIOpportunityChat.tsx`, `src/components/search/SaveSearchModal.tsx`
- `src/pages/Settings.tsx` (hide Notifications tab if option a)

## Question for you
For #4, do you want **(a) hide the Notifications tab** or **(b) build the email digest pipeline** in this pass?
