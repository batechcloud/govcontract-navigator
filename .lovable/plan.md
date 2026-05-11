
# Full-Sweep Stabilization Plan

You asked for a full sweep with **Performance & UX polish** as the top priority. A single mega-change risks breaking working features, so I'll execute this in **5 sequential passes**, each ending in a runnable, verifiable state. After each pass you can stop, review, and decide whether to continue.

Lead priority (Pass 1) goes deep. Later passes are tightly scoped — they fix concrete issues, not speculative refactors.

---

## Pass 1 — Performance & UX Polish (lead)

**Frontend perf**
- Audit `App.tsx` route tree: ensure every page is `React.lazy` + `Suspense` with the standard logo loader fallback. Add lazy loading to any eager imports (Admin pages, ProposalEditor, USASpendingIntel, SectorBrowse).
- Add `React.memo` to hot list items: `OpportunityCard`, `KanbanCard`, `ListView` row, search result row.
- Stabilize React Query keys in `useSearch`, `useCachedContracts`, `useTrackedContracts`, `useUSASpending`. Confirm `staleTime: 5m / gcTime: 30m` defaults are applied in `QueryClient` (not per-hook overrides drifting).
- Replace any `useEffect` that calls `setState` from `location.search` with `useSearchParams` to cut re-renders.
- Bundle: dynamic-import `recharts` and `framer-motion` only where needed; verify `lucide-react` icons are tree-shaken (no `import * as Icons`).
- Run `browser--performance_profile` on `/dashboard`, `/dashboard/contract/:id`, `/usaspending`, `/tracked` to confirm wins.

**UX polish**
- Standardize loading: every async surface uses `animate-shimmer` skeleton or the framer-motion logo loader (per memory). Remove ad-hoc spinners.
- Standardize empty states: icon + one-line plain-language message + primary action. Apply to Search, Tracked, Proposals, Saved Searches, Conversations.
- Standardize error states: `toast.error` + inline retry button. No silent failures.
- Toast hygiene: dedupe duplicate toasts on retry loops; use `toast.warning` for soft fallbacks (per memory rule).
- Mobile pass at 375px on the 6 core sections: sidebar drawer, search filters, contract detail grid, kanban horizontal scroll, settings tabs.
- Keyboard shortcut `/` to focus search bar (per PRD); ensure `Esc` closes modals consistently.

---

## Pass 2 — Frontend stability & a11y

- TypeScript: surface and fix any `tsc` errors revealed by build.
- Console: eliminate every warning on `/`, `/dashboard`, `/dashboard/contract/:id`, `/admin/sync`, `/admin/audit`, `/settings`. Common targets: missing `key` props, controlled/uncontrolled input flips, `useEffect` missing deps that cause loops.
- Wrap every lazy route in `<ErrorBoundary>`; add a single global boundary in `App.tsx` with a friendly fallback.
- Forms: confirm Zod schemas on Onboarding, CompanyProfile, SaveSearchModal, NotesModal, AdminLogin. Add length caps where missing.
- A11y: alt text on all `<img>`, `aria-label` on icon-only buttons in sidebar/header, focus rings preserved on all interactive elements.

---

## Pass 3 — Backend, edge functions, and DB

- Audit every edge function for: CORS headers on **all** responses incl. errors, manual JWT verification (per security memory), Zod input validation, structured error JSON `{ error, code }`, no `service_role` exposure to clients.
- `sam-sync-control`, `sam-sync-incremental`: confirm exponential backoff, 429 preservation, checkpoint resumption, `cancel_requested` honored in tight loops.
- `ai-document-summary`, `ai-opportunity-chat`, `ai-generate-proposal`, `ai-contract-summary`: ensure consistent error mapping (already done for document-summary), timeout handling, payload size guard.
- DB: run `supabase--linter`. Add indexes if missing on `sync_audit_log(created_at)`, `sync_audit_log((details->>'job_id'))`, `sync_failed_records(job_id)`, `tracked_contracts(user_id, status)`, `chat_messages(conversation_id, created_at)`, `cached_contracts(user_id, fetched_at)`. Run `EXPLAIN` on the heaviest queries.
- Rate limit (`check_and_increment_rate_limit`): verify edge functions surface 429s as `toast.warning` with reset time, not generic 500.

---

## Pass 4 — Security hardening

- Run `security--run_security_scan` and `supabase--linter`; fix all error/warn findings.
- Re-verify RLS on every table: owner-scoped USING + WITH CHECK. Audit-log tables admin-read-only via `is_admin()`.
- Confirm `useAuth` null-fallback risk (per memory) is gated everywhere admin-only behavior is gated; `AdminRoute` is the single chokepoint.
- Edge functions: verify none accept SQL strings; all use typed client APIs.
- Input sanitization: confirm `dangerouslySetInnerHTML` is never used with user content (search the repo).
- Secrets: confirm no service_role key in any client bundle (grep `SERVICE_ROLE`).

---

## Pass 5 — Code quality & deployment

- Remove dead code surfaced by Pass 1–4.
- Confirm `supabase/config.toml` has `verify_jwt = false` for every function that does manual JWT validation in code, matching the security memory.
- README quick-update: list 6 core sections, admin setup steps (allowlist secret), daily cron, rate limits.
- Final smoke test in the browser tool across: signup → onboarding → search → save → track → kanban → proposal generate → admin login → sync trigger → audit page.

---

## Out of scope (call out explicitly)

- No new features, no design redesign, no test suite buildout (you didn't ask, and adding tests across a codebase this size is its own multi-day project — happy to do it in a follow-up).
- No payment integration changes (Stripe portal flow per memory stays as-is).
- No swapping of libraries (React Query, Zustand, Recharts, framer-motion stay).

---

## How to use this plan

Approve to start **Pass 1**. After each pass I'll summarize what changed, what I verified (console clean, perf numbers, lighthouse-style checks via browser tools), and pause for your go/no-go on the next pass. This keeps regressions traceable to a single pass instead of a 50-file mystery diff.
