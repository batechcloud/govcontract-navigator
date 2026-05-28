# Codebase Audit & Cleanup — Phased Plan

No new features. No design/UX changes. Conservative deletions only. Each phase ends with a static check (typecheck/lint/build) plus a manual smoke test in the preview, then I stop and wait for your approval before starting the next phase.

## Ground rules

- Do not touch: `src/integrations/supabase/types.ts`, `supabase/config.toml` JWT settings, RLS policies, design tokens, public API contracts of edge functions.
- Keep all legacy `<Navigate>` redirect routes in `App.tsx` (inbound links may rely on them).
- Keep exports that are only consumed across module boundaries even if unused inside the file.
- No DB schema changes unless a phase uncovers an actual bug. If one is needed, I will pause and propose a migration before writing it.
- Every change is small and reviewable. If a phase grows beyond ~10 files, I split it.

## Phase 1 — Dead code & redundancy (in-file only)

Scope:
- Remove unused imports, unused local vars, unreferenced helper functions inside a file.
- Remove commented-out code blocks (not doc comments).
- Consolidate obvious duplicate helpers into existing `src/lib/` modules only when call sites are identical.
- Run `depcheck` (read-only) and **report** unused npm deps; remove only ones that are 100% safe (no dynamic import, no peer-dep usage). Anything ambiguous stays.

Out of scope: deleting components, routes, hooks, or edge functions even if they look unused.

Verify: `npm run lint`, `npm run build`, load `/`, `/auth`, `/dashboard`, `/admin/sync` in preview.

## Phase 2 — Broken or incomplete features

Walk every route in `App.tsx` plus every admin route. For each:
- Render check via preview (no console errors, no blank screens).
- Click every primary button/form/link; confirm it triggers its handler and the handler completes.
- Confirm `supabase.functions.invoke` and direct DB calls handle `{ data, error }` and surface errors via `toast`.
- Confirm navigation targets exist (no dead `<Link to=...>`).

Deliverable: a short list of actual defects found, with a targeted fix per defect. No speculative refactors.

Verify: re-walk the same routes after fixes.

## Phase 3 — Data & state integrity

- Confirm `ProtectedRoute` and `AdminRoute` redirect unauthenticated users (smoke via incognito-style preview navigation).
- For every `useQuery`/`useMutation` in `src/hooks/`, confirm loading + empty + error states render something visible. Patch only the ones that silently swallow.
- Confirm Zustand `contractStore` persist key still hydrates correctly.
- Re-check RLS-dependent reads from the client surface a toast on error rather than rendering empty.

## Phase 4 — Sync & background jobs

- Verify the `pg_cron` schedule for `nightly-sync-dispatch` exists at 02:00 UTC and points at the right function URL (read `cron.job`).
- Manually trigger SAM + USASpending from `/admin/sync` and confirm:
  - `sync_runs` row written with correct status (`success` / `rate_limited` / `failure`).
  - `sync_metadata.last_synced_at` updates on success.
  - Rate-limit guard (added last loop) still blocks re-runs within 24h.
  - Admin page renders the latest run and toast fires once per `rate_limited` run.
- Check `nightly-sync-dispatch` Edge Function logs for the most recent invocation.

No code changes unless a defect is found.

## Phase 5 — Console, runtime, and type errors

- Open key routes in the preview, collect console errors/warnings, fix only real ones (React key warnings, act warnings, missing deps in `useEffect` that cause real bugs — not cosmetic ones).
- Run `npm run lint` and fix actionable rule violations. `no-unused-vars` is off in this repo per `eslint.config.js`, so I will not flip it on.
- `tsc --noEmit` clean pass (project has `strictNullChecks: false`; I will not tighten it).

## Phase 6 — Performance & secret hygiene

- Spot-check for `useEffect` with missing/over-broad deps causing extra fetches; fix only the ones with measurable impact.
- Confirm large list pages (`SearchHub`, `TrackedContracts`, `AdminUsers`, `AdminWorkspaces`) cap rows (pagination/limit already exists per memory — verify).
- Grep the client bundle source for any hardcoded keys/secrets. The build's `secretScannerPlugin` should already catch JWTs/API keys; I will verify it runs clean on `npm run build`.

## Phase 7 — Consistency pass

- Naming: only rename when a file/symbol is clearly misnamed and unimported elsewhere. No mass renames.
- Confirm every page sets a document title via `react-helmet-async` (per memory). Add `<Helmet>` only where missing.
- Folder structure: report mislocated files; move only with explicit per-file approval.

## Deliverable per phase

Each phase ends with:
1. List of files changed (or "no changes needed").
2. List of issues found and how each was fixed.
3. Smoke-test summary (routes walked, console clean, build green).
4. Stop and wait for your go-ahead before the next phase.

## Technical notes

- Tools used: ripgrep for usage analysis, `depcheck` for unused deps (report-only first), `tsc --noEmit`, `eslint`, `vite build`, browser tool for preview smoke, `supabase--read_query` for `sync_runs` / `sync_metadata` / `cron.job` inspection, `supabase--edge_function_logs` for dispatcher health.
- No edits to `types.ts`, no RLS changes, no design token changes, no removal of redirect routes.

Ready to start Phase 1 on approval.