## Goal

`/admin/sync` already has **Run Sync Now** / **Run All** buttons. Add a matching **Stop** button so admins can cancel a long-running sync without waiting for the edge-function wall-time budget to expire.

## How cancellation works

The nightly sync functions run as a single long-lived loop that pages SAM.gov / USASpending and upserts rows. We can't "kill" the Deno invocation from outside, but we can cooperatively cancel by:

1. Setting a `cancel_requested` flag on the `sync_runs` row.
2. Having the loop re-read that flag after each page (cheap — already updating the row each page) and break out gracefully, marking the run as `cancelled` with whatever was already fetched.

## Changes

### 1. DB migration
- Add `cancel_requested boolean not null default false` to `public.sync_runs`.
- Allow `status = 'cancelled'` (column is plain `text`, so no enum change needed).

### 2. New edge function `admin-cancel-sync`
- Mirrors `admin-run-sync` auth pattern: requires `Authorization: Bearer <user jwt>`, validates `is_admin(uid)`, rejects otherwise.
- Body: `{ source: "sam" | "usaspending" | "both" }`.
- Looks up the most recent `sync_runs` row with `status = 'running'` for each requested source and sets `cancel_requested = true`.
- Registered in `supabase/config.toml` with `verify_jwt = false` (we validate manually).

### 3. Edge function loop changes
In both `nightly-sync-sam` and `nightly-sync-usaspending` (and any shared helper):
- Inside the page loop, after each `sync_runs` progress update, re-query `cancel_requested` for the current `run_id`. If true, break out.
- On graceful cancel, the outer handler marks the run `status = 'cancelled'`, sets `finished_at`, and keeps the partial counters. Cursor is NOT advanced on cancel.

### 4. AdminSync UI (`src/pages/AdminSync.tsx`)
- Add a `cancel` mutation calling `admin-cancel-sync`.
- Per-source card: when a run is `running`, swap the disabled "Syncing…" button for a **Stop Sync** button (destructive variant) that calls `cancel.mutate(src)`. Show "Stopping…" while the flag flips but the loop hasn't seen it yet.
- Header: add a **Stop All** button next to **Run All**, enabled only when any run is `running`.
- Status badge: render `cancelled` as a neutral/amber badge (`AlertCircle`), distinct from `failure`.
- Polling (5s while running) already picks up the new status automatically.

### 5. Types
Extend the local `SyncRun` union: `status: "running" | "success" | "failure" | "cancelled"` and add optional `cancel_requested: boolean`.

## Out of scope
- No changes to the nightly cron schedule.
- No retry/resume UI — cancelled runs simply stop; next nightly (or manual) run picks up from the existing cursor.
