## Goal

Convert SAM.gov access to a fully database-first, admin-controlled ingestion system. Frontend reads only from the local `contracts` table. Admins manage full imports, incremental syncs, and failed records from a new admin console.

## What already exists (will be reused)

- `contracts` table — global cache, GIN-indexed (already feeds `useCachedSearch`)
- `sync_metadata` table — tracks last run timestamp
- `sam-sync-incremental` edge function — pulls recent SAM.gov pages and upserts
- Daily `pg_cron` job at 06:00 UTC
- `user_roles` table + `has_role(uid, 'admin')` security-definer function
- Per-user 50/day rate limit on `sam-search`

## What's missing (to build)

### 1. Database schema additions (migration)

```text
sync_jobs            One row per import/sync run
  id, job_type ('full' | 'incremental' | 'manual'),
  status ('queued' | 'running' | 'completed' | 'failed' | 'cancelled'),
  triggered_by (uuid, nullable for cron),
  started_at, finished_at,
  posted_from, posted_to, current_offset,
  total_records (api-reported), records_inserted, records_updated, records_failed,
  last_error, cancel_requested (bool), checkpoint (jsonb)

sync_failed_records  Dead-letter queue
  id, job_id, contract_id, payload (jsonb), error, attempts, created_at

sync_audit_log       Admin actions
  id, actor_id, action, details (jsonb), created_at
```

RLS:
- All three tables: only `has_role(auth.uid(),'admin')` can SELECT/INSERT/UPDATE; service role full.
- Admin policies use the existing `has_role` security-definer function (no recursion risk).

Indexes already on `contracts` (GIN on title/description, btree on naics_code, set_aside, deadline, posted_date) — confirmed sufficient for the search filters in `useCachedSearch`.

### 2. New edge functions (all `verify_jwt = false`, manual JWT + admin check inside)

- **`sam-sync-full`** — full historical import.
  - Admin-gated. Creates a `sync_jobs` row, returns `job_id` immediately, then runs in the background via `EdgeRuntime.waitUntil(...)`.
  - Walks SAM.gov in 1000-record pages within rolling 6-month windows (SAM.gov hard limit), stepping window-by-window backwards.
  - Saves `current_offset` + `posted_from/to` to `sync_jobs.checkpoint` after every page → resumable.
  - Exponential backoff (1s, 2s, 4s, 8s, max 30s) on 429/5xx; 3 retries per page; failed pages logged to `sync_failed_records`.
  - Checks `cancel_requested` between pages → graceful stop.
  - Bulk upsert into `contracts` (`onConflict: contract_id`).

- **`sam-sync-control`** — admin actions: `start_full`, `start_incremental`, `cancel`, `retry_failed`, `status`. Returns job rows + aggregate metrics.

- Update **`sam-sync-incremental`** to also write a `sync_jobs` row (so cron + manual runs share the same dashboard view).

- **Lock down `sam-search`**: keep the function for the admin-driven sync only — frontend stops calling it. (Alternatively gate it admin-only; we'll gate admin-only to keep API budget for sync.)

### 3. Frontend changes

- **`SearchHub.tsx`**: remove `useSmartSearch` (which calls `sam-search`); route smart/natural-language search through `parse-search-query` → then `useCachedSearch` (DB only). Subaward search via USAspending stays.
- **`SectorBrowse.tsx`** and **`ContractDetail.tsx`**: replace `sam-search` invocations with queries against `contracts` table (and `contract_summaries` for AI summary).
- New **`/dashboard/admin/sync`** route, guarded by `useAuth` + a new `useIsAdmin()` hook (`SELECT has_role`). Sidebar link visible only to admins.

### 4. Admin Sync Console UI (`src/pages/AdminSync.tsx`)

Sections:
- **Top metrics**: total contracts in DB, last sync at, last duration, currently-running job badge.
- **Action buttons**: Run Full Import · Run Incremental Sync · Stop Current Job · Retry Failed Records.
- **Live progress card** (polls `sam-sync-control?action=status` every 3s while a job is running): progress bar (`current_offset / total_records`), records/sec, ETA, current window.
- **Recent jobs table**: type, status, started, duration, inserted/updated/failed, triggered_by.
- **Failed records drawer**: paginated list with error + retry button (single or bulk).
- Toast notifications for start/stop/retry; confirmation dialog before "Run Full Import".

### 5. Cron job update

Existing `pg_cron` daily call already hits `sam-sync-incremental`; no change needed beyond letting it write a `sync_jobs` row.

## Out of scope

- Switching to Redis/BullMQ — Supabase edge runtime + `sync_jobs` checkpoint table provides equivalent durability for our scale; not introducing new infra.
- New `agencies` / `naics_codes` / `vendors` tables — current `contracts` schema with text columns + indexes is sufficient for the search/filter UI we have. Can be added later if normalized lookups are needed.
- Soft-delete of disappeared SAM records (low priority, can be added in a follow-up by diffing per window).

## Acceptance criteria

1. Frontend never invokes `sam-search` for normal users.
2. Non-admins get 403 from any sync edge function and cannot see the Admin Sync route.
3. Admin can launch a full import, watch it progress, cancel it, and resume after an interruption (verified by killing the function mid-run and re-launching — checkpoint picks up).
4. Failed pages land in `sync_failed_records` and can be retried from the UI.
5. Daily cron sync still runs and shows up in the recent jobs table.