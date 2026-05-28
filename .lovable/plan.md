# Nightly Data Sync Rebuild

Two independent nightly syncs (SAM + USASpending) running at 02:00 UTC, writing to brand-new tables, with full admin visibility and the user-facing UIs reading only from the local DB.

## 1. Database (single migration)

New tables — both global, read-only to authenticated users, written only by service role:

**`public.sam_opportunities`**
- `notice_id` text unique (external ID, lowercased)
- title, agency, sub_agency, office, description, naics_code, psc_code, set_aside, contract_type, location, value numeric, posted_date, deadline, solicitation_number, url, resource_links text[], raw jsonb
- `synced_at timestamptz default now()`, created_at, updated_at
- Indexes: unique(notice_id), GIN on (title, description) via pg_trgm, btree on posted_date desc, naics_code, agency

**`public.usaspending_awards`**
- `award_id text unique` (Award ID from API), generated_internal_id text
- recipient_name, recipient_uei, awarding_agency, awarding_sub_agency, funding_agency, naics_code, psc_code, award_type, award_amount numeric, base_obligation numeric, date_signed, period_of_performance_start, period_of_performance_end, place_of_performance jsonb, description, raw jsonb
- `synced_at timestamptz default now()`, created_at, updated_at
- Indexes: unique(award_id), btree on date_signed desc, recipient_uei, naics_code, awarding_agency

**`public.sync_runs`** (replaces ad-hoc reuse of `sync_jobs` for nightly visibility)
- id uuid pk, source text check in ('sam','usaspending'), status text ('running','success','failure'), started_at, finished_at, records_fetched int, records_inserted int, records_updated int, pages int, last_error text, triggered_by uuid null, manual bool default false

**`public.sync_cursors`** (per-source last-success timestamp)
- source text pk, last_synced_at timestamptz, last_run_id uuid

GRANTs: SELECT to `authenticated` on the three data tables + sync_runs (admin UI reads); ALL to `service_role`. RLS enabled. Policies: select-for-authenticated on all four; admin-only read on sync_cursors via `is_admin(auth.uid())`.

Old `contracts`, `contract_summaries`, `sync_jobs`, `sync_metadata`, `sync_failed_records`, `sync_audit_log` tables stay in place for now (existing features depend on them); new pipeline is fully isolated. A follow-up cleanup can drop them once the swap is verified.

## 2. Edge functions

All deploy with `verify_jwt=false`; admin-callable ones do manual JWT + `is_admin` check.

- **`nightly-sync-sam`** — service-role only. Reads `sync_cursors.sam` (defaults to now()-12mo on first run, capped at 6mo for SAM lookback per existing constraint), pages SAM.gov v2 `opportunities/v2/search` 1000/page until cutoff reached, upserts into `sam_opportunities` on conflict(notice_id), writes a `sync_runs` row, updates cursor on success.
- **`nightly-sync-usaspending`** — service-role only. Reads `sync_cursors.usaspending` (defaults to now()-12mo). POSTs `/api/v2/search/spending_by_award/` with `filters.award_type_codes=['A','B','C','D']` and `filters.time_period=[{start_date,end_date,date_type:'date_signed'}]`. Paginates `page`/`limit=100` until `hasNext=false`. Upserts on `award_id`.
- **`nightly-sync-dispatch`** — pg_cron target. Invokes both functions in parallel via `Promise.allSettled`, returns per-source results. Wraps each in try/catch so one failure can't block the other.
- **`admin-run-sync`** — admin-only. Body `{ source: 'sam' | 'usaspending' | 'both' }`. Invokes the matching nightly function(s) with `manual=true`.

pg_cron job (via `supabase--read_query`/SQL run, not migration — contains anon key):
```
select cron.schedule('nightly-sync', '0 2 * * *',
  $$ select net.http_post(...nightly-sync-dispatch...) $$);
```
The existing 06:00 SAM cron will be **unscheduled** in the same SQL step.

## 3. Frontend swap

- New `src/hooks/useUSASpendingLocal.tsx` — React Query reads from `usaspending_awards` table directly. Implements the same shape currently consumed by USASpending pages so changes are minimal.
- Update `useUSASpending.tsx` + USASpending page components (`AwardExplorer`, `TopRecipients`, `TopAgencies`, `GeographicSpending`, `SmallBusinessIntel`, `SpendingByCategory`, `SpendingTrends`, `SpendingSnapshot`) to read from the local hook instead of invoking `usaspending-search`.
- Update `useSearch.tsx` / `useCachedContracts.ts` / contract detail flows to read from `sam_opportunities` instead of `contracts`.
- Delete `usaspending-search` invocation paths (function file stays until DB swap is verified, then removed in cleanup).
- Add a `synced_at` "Data last updated" badge on both pages (small text, muted).

## 4. Admin "Data Sync" page

Rewrite `src/pages/AdminSync.tsx`:
- Two source cards (SAM, USASpending) showing: last successful sync time, record count in each table, last run status, "Run Sync Now" button per source plus a "Run Both" button.
- Below: history table with last 10 runs from `sync_runs` (source, status, started/finished, fetched/inserted/updated, error preview).
- New hook `useSyncStatus` (React Query, polls every 15s while a run is `running`).
- Keep the old `/admin/sync/:jobId` detail route accessible for the legacy `sync_jobs` history until cleanup.

## 5. Out of scope (deliberate)

- Dropping old tables / removing old SAM cron edge functions — done in a follow-up after verifying record counts in the new tables.
- USASpending subawards/transactions (user chose prime-only).
- Backfill beyond 12 months.

## Risks / notes

- "Rebuild SAM from scratch" means every existing feature touching `contracts` (search, contract detail, AI summary, recommendations, tracked-contract enrichment) gets repointed to `sam_opportunities`. This is the bulk of the frontend work and the highest-risk part — keeping the old table populated by the legacy cron until the swap is verified is the safety net.
- First USASpending run with a 12-month window will likely take several minutes and may need to chunk by month inside the function to stay under the edge function 150s wall-clock. The function will checkpoint to `sync_runs` and resume from the last completed month on the next invocation if needed.
- SAM.gov hard-caps `postedFrom` at 6 months; the 12-month baseline only applies to USASpending. SAM's first run uses 6 months.
