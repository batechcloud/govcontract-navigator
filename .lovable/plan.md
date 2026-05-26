# User/Workspace Dashboard QA

Code-review pass over every page under `/onboarding` and `/dashboard/*`, every hook they call, and every edge function / RPC referenced. Pages load and their happy paths work — the issues below are real bugs, gaps, and polish items grouped by severity.

## ✅ What works

- **Auth / routing** — `ProtectedRoute` (auth + onboarding gate) and the lazy-loaded routes all resolve. Old removed routes (`/dashboard/journey`, `/competitors`, `/win-loss`, `/calendar`, `/documents`, …) all redirect correctly.
- **Onboarding** — 4 steps, saves `company_profiles` + flips `profiles.onboarding_completed`, invalidates the right query keys.
- **Dashboard Home** — welcome banner, 4 quick actions, AI recommendations + profile health cards, upcoming-deadlines list (driven by `useTrackedContracts`).
- **Search Hub** — cache-first reads from `contracts`, NL parse → structured filters, save-search, win-probability modal, subaward tab. RLS-safe.
- **Tracked / Opportunities** — kanban + list views, status / notes / priority updates, untrack. `(user_id, contract_id)` unique constraint confirmed in DB → `upsert` is correct.
- **My Business** — profile load + upsert, NAICS/PSC selectors, document upload (10 MB cap, `documents` bucket), preview/download/delete.
- **Proposals + Generator + Editor** — generate via `ai-generate-proposal`, multi-step progress UI, confetti, docx/text export, inline edits with save.
- **Ask AI** — streaming via `ai-opportunity-chat`, conversation persistence, ?q= deep-link, history sidebar with delete.
- **USASpending Intelligence** — 9 panels driven by `usaspending-search`, FY selector + refresh invalidation.
- **Sector Browse** — pie/bar charts, navigates to `/dashboard/search?sector=…`.
- **Contract Detail** — three-tier data fallback (router state → tracked → cached → live `sam-refresh-single`), attachments, AI summary.
- **Settings (Profile/Notifications/Security/Users)** — avatar upload, name save, notification prefs merged (not clobbered), password change, sign-out, workspace user invite/role/remove gated to owner.

## 🐞 Bugs to fix

1. **Suspended users still access the app.** `profiles.is_suspended` is set by admin but `ProtectedRoute` never checks it — a suspended user lands on `/dashboard` like normal. Need a check that signs them out (or shows a "Account suspended — contact support" screen) when `profile.is_suspended === true`.

2. **`profiles.last_active_at` is never written.** Admin overview, workspace detail, and users list all read this column, but no client/hook updates it on session start or navigation. Today it stays NULL for everyone, so all admin "last active" timestamps are blank.

3. **Settings → Billing tab is hard-coded.** `useSubscription()` returns the real plan/period/status, but the Billing tab renders a static green "Active" pill and a placeholder "No payment method" card regardless of subscription. Should show plan name, monthly price, current period end (or "Starter — free"). The "Update Payment Method" and "Manage Billing" buttons just `toast.info("Stripe integration required")` — fine as a stub, but the status section should be honest.

4. **`CompanyProfile` save is not disabled for viewer-role members.** A workspace `viewer` will hit the Save button, the upsert fails under RLS (`is_workspace_editor()` rejects), and a generic "Error" toast appears. The page should disable Save (and ideally show a read-only banner) when `useWorkspacePermissions().canEdit === false`. Same applies to document upload/delete and capability add/remove.

5. **Sector Browse stats are misleading.** `fetchSamContracts()` does `select("naics_code", { count: "exact" }).limit(1000)`. The headline badge shows `count` (e.g. "120k total on SAM.gov") while the per-sector counts only reflect the first 1000 rows. Either drop the misleading total or fetch sector counts via a grouped query / RPC so they line up.

6. **Notifications tab toggles save but nothing acts on them.** `opportunities / deadlines / digest / competitors` are persisted into `profiles.notification_preferences`, but no edge function or cron job reads them — none of those emails are actually sent. Toggles are visual-only today.

## ✨ Polish

7. **Header bell button** in `DashboardLayout` is a no-op with tooltip "Notifications coming soon". Either wire it to a placeholder popover ("No notifications yet") or hide it until real notifications exist.

8. **`FeatureGate` / `UsageLimitBanner` are defined but never used.** `useFeatureAccess` works, but nothing in the UI gates AI proposal generation, AI chat, or saved-search count against `plan_features.usage_limit`. Users on Starter can generate unlimited proposals today.

9. **AdminOverview "Recent signups" first names** — already fixed last loop via `admin_recent_signups` RPC. Confirmed wired.

10. **`/dashboard/sectors` AllSectors button** uses emoji 🌐 inline — fine, but the card is keyed off `counts["all"] = contracts.length`, which is capped at 1000 along with #5.

## 🛠 Proposed action

Per your "fix small bugs, report big ones" rule:

**Auto-fix in this loop (small, frontend-only):**
- #3 Surface real subscription info in Settings → Billing (use `useSubscription`, show plan name, period end, "Starter" fallback).
- #4 Disable Save / Upload / Add / Remove for non-editors in `CompanyProfile`, with a "Read-only — ask the owner to upgrade your role" banner.
- #5 Replace the misleading "total on SAM.gov" badge with "showing first 1000 contracts" (or hide it) and add a footnote on Sector Browse.
- #7 Wire the bell button to a simple "You're all caught up" popover.

**Report only (bigger / cross-cutting — wait for your call):**
- #1 Suspended-user enforcement (needs a UX decision: hard sign-out vs. blocked screen).
- #2 `last_active_at` writer (cheap: ping `profiles.update` on `AuthProvider` mount, but should debounce/throttle).
- #6 Notification email pipeline (requires a cron + Resend/SES edge function — multi-day).
- #8 Real feature gating with `FeatureGate` on Proposal Generator, AI Chat, Saved Searches.

Approve and I'll ship #3, #4, #5, #7. Tell me which of #1, #2, #6, #8 to schedule next.
