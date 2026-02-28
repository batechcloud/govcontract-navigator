

## Plan: Local Contract Cache with Per-Contract Refresh

### Overview
Store all API-fetched contracts in a Supabase `cached_contracts` table. Searches will query this local cache first (fast, no API cost). A "Refresh" button on each contract re-fetches that single contract from SAM.gov. A global "Sync from API" button fetches new data from the API and merges it into the cache.

### Database Changes

**New table: `cached_contracts`**
- `id` (uuid, PK)
- `contract_id` (text, unique) — the SAM.gov / USASpending ID
- `title`, `agency`, `description`, `location` (text)
- `value` (numeric)
- `deadline` (timestamptz, nullable)
- `posted_date` (timestamptz, nullable)
- `naics_code`, `set_aside`, `contract_type`, `sector` (text)
- `source` (text) — "SAM.gov" or "USASpending"
- `url` (text)
- `match_score` (integer)
- `resource_links` (text[])
- `solicitation_number` (text, nullable)
- `raw_data` (jsonb) — full API response for that contract
- `fetched_at` (timestamptz, default now()) — when last refreshed from API
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `user_id` (uuid) — owner of the cached data

RLS: users can SELECT/INSERT/UPDATE/DELETE their own rows.

### Code Changes

**1. New hook: `src/hooks/useCachedContracts.ts`**
- `useCachedSearch(filters)` — queries `cached_contracts` table with Supabase `.ilike()`, `.in()`, `.gte()/.lte()` filters. No API call, instant results.
- `useSyncFromApi()` — mutation that calls the SAM edge function, then upserts results into `cached_contracts`. Used by the global "Sync New Contracts" button.
- `useRefreshContract(contractId)` — mutation that re-fetches a single contract from SAM.gov by solicitation number, updates the cached row with fresh data and a new `fetched_at` timestamp.

**2. New edge function: `supabase/functions/sam-refresh-single/index.ts`**
- Accepts a `solicitationNumber` or `noticeId`
- Calls SAM.gov API for that single opportunity
- Returns the latest data
- Does NOT count against the daily search rate limit (or counts as 1)

**3. Modify `src/pages/SearchHub.tsx`**
- Default search behavior: query `cached_contracts` table instead of calling SAM API
- Add a prominent "Sync from API" button (with rate-limit indicator) that fetches fresh data from SAM.gov and upserts into cache
- On each contract card, add a small "Refresh" icon button showing `fetched_at` age (e.g., "2d ago") — clicking it calls `useRefreshContract`
- Quick filters and keyword search operate on the local cache (fast, no API calls)

**4. Modify `src/hooks/useSearch.tsx`**
- `useSmartSearch` gains a `searchLocal` mode that queries the cache table
- API search becomes "sync" mode, only triggered explicitly by the user

**5. Update search result cards in `SearchHub.tsx`**
- Add a `RefreshCw` icon button per card
- Show "Last updated: X ago" timestamp from `fetched_at`
- Refresh button calls the single-contract refresh mutation

### User Flow
1. **First visit**: Cache is empty → user clicks "Sync from API" → results fetched and stored
2. **Subsequent visits**: Search queries the cache instantly (no API call)
3. **Per-contract refresh**: User clicks refresh icon on a card → that one contract is re-fetched from SAM.gov
4. **Bulk sync**: User clicks "Sync from API" again to pull latest batch (counts against daily limit)

### Technical Details
- Cache table uses `ON CONFLICT (contract_id, user_id) DO UPDATE` for upsert logic
- Local search uses Supabase PostgREST filters: `.ilike('title', '%keyword%')`, `.in('set_aside', [...])`, etc.
- `fetched_at` column lets the UI show data freshness per contract
- The single-contract refresh edge function uses the SAM.gov `opportunities/{noticeId}` endpoint (1 API call, not a search)

