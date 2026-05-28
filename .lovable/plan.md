# Stop SAM.gov sync on rate limit + notify admin

## Problem
When SAM.gov returns HTTP 429 (daily quota exceeded), the sync currently:
- Retries 4× with 1/2/4/8s backoff (pointless — daily quota only resets at midnight UTC)
- In `_shared/sam-sync.ts` `runWindow`, a failed page just advances `offset` and keeps querying, burning more 429s and inflating `records_failed`
- In `nightly-sync-sam`, it throws *after* the retries and marks the run `failure` with a generic message — admin has no idea it was a quota issue and the next manual click immediately tries again
- The UI shows no toast; the user sees a spinner or a generic error

## Fix

### 1. Detect 429 explicitly (shared + nightly)
In `fetchSamPage` (`supabase/functions/_shared/sam-sync.ts`) and `fetchPage` (`supabase/functions/nightly-sync-sam/index.ts`):
- On `resp.status === 429`, return immediately with `{ ok: false, status: 429, body, rateLimited: true }` — **no retry** (daily quota, retrying in seconds is futile).
- Keep existing retry/backoff for 5xx only.

### 2. Abort whole sync on 429 (no continuation, no next page)
- **`_shared/sam-sync.ts` `runWindow`**: on a 429 result, return `{ outcome: "rate_limited", ... }` (new outcome) instead of treating it as a normal failed page and advancing.
- **`runFullImport` / `runIncrementalImport`**: when a window returns `rate_limited`, mark job `status='rate_limited'`, set `last_error='SAM.gov daily API quota reached. Sync will resume after reset (midnight UTC).'`, set `finished_at`, **do not call `triggerContinuation`**.
- **`nightly-sync-sam` `runSync`**: same — break loop, mark `sync_runs.status='rate_limited'` with same `last_error`, do not throw (so the run row reflects the real cause, not a generic failure).

### 3. Block re-runs while rate-limited
- **`nightly-sync-dispatch` cron**: before invoking `nightly-sync-sam`, query the latest `sync_runs` for source `sam` *today (UTC)*; if `status='rate_limited'`, skip SAM dispatch and log. USASpending continues unaffected.
- **`admin-run-sync` edge function**: same guard — return `409 { error: "SAM.gov daily limit reached, try again after 00:00 UTC", reset_at }` if a rate-limited run exists today. (USASpending unaffected.)

### 4. DB migration
Add `'rate_limited'` to the `sync_runs.status` and `sync_jobs.status` CHECK constraints (same pattern as the recent `cancelled` migration).

### 5. Admin UI (`src/pages/AdminSync.tsx`)
- Poll already runs every few seconds. When the latest SAM run's `status` flips to `rate_limited`, fire `toast.error("SAM.gov daily API limit reached. Sync paused until midnight UTC.", { duration: 10000 })` **once per run id** (track last-shown id in a ref to avoid spam).
- Render a distinct amber "Rate limited" badge (instead of red "failure") in the runs list for that row.
- When the most recent SAM run is `rate_limited` and still within the same UTC day, disable the "Run SAM sync" / "Run both" buttons with a tooltip showing the reset time; the "Run USAspending" button stays enabled.
- If the admin clicks anyway and the edge function returns the 409 above, surface its message via `toast.error`.

## Files touched
- `supabase/migrations/<new>.sql` — extend status check constraints
- `supabase/functions/_shared/sam-sync.ts` — 429 detection, new `rate_limited` outcome, no-continuation path
- `supabase/functions/nightly-sync-sam/index.ts` — 429 detection, `rate_limited` status, no throw
- `supabase/functions/nightly-sync-dispatch/index.ts` — guard against re-dispatch today
- `supabase/functions/admin-run-sync/index.ts` — guard + 409 response
- `src/pages/AdminSync.tsx` — toast on transition, badge, disabled button + tooltip

## Out of scope
- USAspending sync (no daily quota issue here)
- Auto-resume scheduling beyond what the existing nightly cron already does at 02:00 UTC (which is after midnight, so it naturally retries the next day)
