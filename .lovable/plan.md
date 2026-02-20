# Production Readiness Audit — Full Application Review

After a deep review of every page, component, hook, edge function, and configuration file, here is a comprehensive gap analysis with a prioritized plan to bring the app to production quality.

---

## Critical Issues (Must Fix Before Launch)

### 1. `useUntrackContract` Deletes by Wrong Field

In `useTrackedContracts.tsx` (line 88), `useUntrackContract` deletes using `.eq("contract_id", contractId)` — but the caller in `TrackedContracts.tsx` passes `contract.id` (the UUID primary key), not `contract.contract_id`. This means the delete will silently fail or delete nothing. The fix is to delete by `.eq("id", contractId)`.

### 2. Settings Billing Tab Has Hardcoded Fake Data

In `Settings.tsx` (lines 342-346), the Billing tab shows hardcoded values: "Starter", "$49/month", "Renews on Jan 13, 2025". This is fake placeholder content, and "Upgrade to Professional" and "View Billing History" buttons do nothing. This must show real subscription data or a clear "No active subscription" state.

### 3. Contact Form Does Not Send Anything

`Contact.tsx` (line 16) has a `setTimeout` simulating form submission but never actually sends the message. For production, this needs to either connect to Resend (email) via an edge function, or at minimum call a real endpoint.

### 4. `useProfile` and `useCompanyProfile` Hooks Always Run (No Auth Guard)

Both `useProfile` and `useCompanyProfile` in `useProfile.tsx` call `supabase.auth.getUser()` internally without being conditioned on auth state. If called on a public page before auth loads, they will throw "Not authenticated" errors. They need `enabled: !!user` from `useAuth()`.

### 8. Contact Page Info Is Placeholder

The contact page shows fake phone number "+1 (800) 555-1234" and fake address "123 Government Way, Washington, DC 20001". These need real info or "Contact us by email" only.

### 9. `ResetPassword` Redirects to Dashboard Without Completing Onboarding Check

In `ResetPassword.tsx` (line 54), after a successful password reset, it always navigates to `/dashboard`. It should check if onboarding is complete first, the same way the Auth login flow does.

---

## Functional Gaps (Incomplete Features Visible to Users)

### 10. Dashboard Header Search Bar Does Nothing

The search input in `DashboardLayout.tsx` (lines 79-84) is a visible `<Input>` with no `onChange`, no `onSubmit`, and no navigation. It either needs to redirect to `/dashboard/search` on submit, or be removed entirely.

### 11. Proposals List Has No Delete Button

In `Proposals.tsx`, each proposal row shows an Edit button but there is no delete action. Users can create proposals but cannot remove them. A delete button with a confirmation dialog is needed.

### 12. `Proposals.tsx` Doesn't Use the Shared `DashboardLayout` Card Components

`Proposals.tsx` uses raw `<div>` elements with manual class strings instead of the `<Card variant="glass">` components used everywhere else in the dashboard. This creates a visual inconsistency.

### 13. Settings Notifications Tab Switches Are Not Persisted

The notification preference switches in `Settings.tsx` (lines 259-275) use `defaultChecked` but have no save logic tied to the database. Clicking "Save Preferences" calls a bare `<Button>` with no `onClick`. The preferences are never written to `profiles.notification_preferences`.

### 14. `useUpdateContractStatus` Only Updates `status` Field, Not `updated_at`

The mutation in `useTrackedContracts.tsx` (line 113) updates only the `status` column. Since there's a `handle_updated_at` trigger installed, this is fine — but the trigger is listed as "no triggers in the database" in the schema context. If the trigger is absent, `updated_at` will never refresh. Should explicitly set `updated_at: new Date().toISOString()` in the update.

### 15. `SavedSearches` Page Exists in Routes as Redirect But No Saved Searches View in Dashboard

The sidebar has no link to saved searches. Users can save a search from the SearchHub, but have no way to view or re-run saved searches. The sidebar could include a "Saved Searches" link, or SearchHub could display them below the search bar.

### 16. "See How It Works" CTA in Hero Links to `/auth?mode=signup` (Same as "Find Contracts Now")

Both Hero buttons now point to the same `/auth?mode=signup`. The secondary button "See How It Works" should ideally scroll to the `#features` section or link to `/solutions` to differentiate the two actions.

---

## UI Polish & Consistency Issues

### 17. `Proposals.tsx` Missing Loading Skeleton

While loading, `Proposals.tsx` only shows `"Loading..."` text instead of the skeleton cards used on every other dashboard page.

### 18. Onboarding Step 1 (`WelcomeStep`) Uses Only `onNext`/`onSkip` — "Continue" Button in Footer Only Appears from Step 2+

On Step 1, the navigation buttons are embedded inside `WelcomeStep` itself. From Step 2+, the global footer nav renders. This means the footer's "Step 1 of 4" label is never visible on Step 1, which is slightly jarring.

### 19. `DashboardLayout` Header Search Bar Not Functional on Mobile

The header search input is hidden on mobile (`hidden sm:block`) but there is no mobile search trigger. Users on mobile have no fast path to search other than tapping the "Find" bottom nav item.

### 20. `AIAssistant` Uses `onKeyPress` (Deprecated)

`AIAssistant.tsx` (line 149) uses the deprecated `onKeyPress` React event. It should use `onKeyDown` to match the pattern already used in `SearchHub.tsx`.

---

## Technical / Security Issues

### 21. `sam-search` Edge Function Has `verify_jwt = false` and Returns Mock Data Without SAM API Key

The search function is publicly accessible (no JWT verification) and falls back to mock data when `SAM_API_KEY` is not set. This is fine for development but the mock data has hardcoded 2024 dates that make contracts appear expired. The mock deadlines need to be updated to dynamic future dates, or a "Demo Mode" banner needs to be added.

### 22. `parse-search-query` and `ai-opportunity-chat` Have `verify_jwt = false`

These functions can be called by anyone, including bots, consuming your OpenAI API credits and Lovable AI credits without any authentication. They should either have JWT verification enabled or implement rate limiting.

### 23. QueryClient Has No Default Error Handling

`App.tsx` creates `new QueryClient()` with no `defaultOptions`. Any uncaught query errors will fail silently. A `defaultOptions.queries.retry` limit and global error toast should be configured.

### 24. Error Boundaries Are Missing

There are no React error boundaries anywhere in the app. If a component throws a runtime error (e.g., a bad API response causes a `.map()` on undefined), the entire app will white-screen. An `ErrorBoundary` should wrap dashboard routes at minimum.

---

## Implementation Plan

The fixes are grouped into 4 focused passes:

### Pass 1 — Critical Bug Fixes (Blocking Production)

- Fix `useUntrackContract` to delete by `id` instead of `contract_id`
- Fix Settings Billing tab to show real data or "No active plan" state
- Remove fabricated trust badges from Footer
- Remove fake contact info from Contact page (replace with email-only)
- Fix social links from `#` to real URLs or remove them
- Remove newsletter fake submit — add "Coming soon" label
- Fix `ResetPassword` to check onboarding before redirecting

### Pass 2 — Functional Completeness

- Make the dashboard header search bar functional (redirect to search on Enter)
- Add delete functionality to `Proposals.tsx` (with confirm dialog)
- Wire up Settings Notifications save to write to `profiles.notification_preferences`
- Add saved searches display in `SearchHub` (below search bar) or sidebar link
- Fix "See How It Works" CTA to scroll to `#features` instead of duplicating the signup link

### Pass 3 — UI Polish

- Replace `Proposals.tsx` loading text with Skeleton cards, and standardize card styling
- Fix `AIAssistant` deprecated `onKeyPress` → `onKeyDown`
- Update mock SAM.gov contract deadlines to future dates
- Add a "Demo Mode" banner on Search when no SAM API key is present

### Pass 4 — Technical Hardening

- Add `enabled: !!user` guard to `useProfile` and `useCompanyProfile` hooks
- Configure `QueryClient` with retry limits and default error handling
- Add a simple `ErrorBoundary` component wrapping dashboard routes in `App.tsx`
- Add rate-limiting or JWT verification to the public edge functions (`parse-search-query`, `ai-opportunity-chat`)

---

## Summary Table


| Priority | Issue                                    | Impact                        |
| -------- | ---------------------------------------- | ----------------------------- |
| CRITICAL | Delete tracked contract uses wrong field | Data never deletes            |
| CRITICAL | Fake billing data in Settings            | Misleading to real users      |
| CRITICAL | Fabricated trust badges                  | Legal/trust risk              |
| CRITICAL | Contact form doesn't send anything       | Lost leads                    |
| HIGH     | Header search does nothing               | Confusing UX                  |
| HIGH     | No delete on proposals                   | Stuck data                    |
| HIGH     | Notifications not saved                  | Settings feel broken          |
| HIGH     | Public edge functions unprotected        | Wasted AI credits/security    |
| MEDIUM   | Deprecated onKeyPress in chat            | Browser console warnings      |
| MEDIUM   | No error boundaries                      | White-screen on errors        |
| MEDIUM   | Mock data has expired dates              | Confusing for demo            |
| LOW      | Both hero CTAs go to same link           | Missed conversion opportunity |
