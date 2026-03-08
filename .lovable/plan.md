

## Plan: Fix Search to Access All SAM.gov Contracts with Proper Pagination

### Problem Analysis

The "Showing 25 of 25" issue stems from the current architecture:

1. **`syncFromApi`** fetches only 25 results from SAM.gov and caches them locally
2. **`cachedSearch.searchLocal`** queries only the local `cached_contracts` table — so "total" reflects cached rows, not SAM.gov's actual total (which could be thousands)
3. **"Load More"** paginates the local cache, never fetching more from SAM.gov
4. The SAM.gov API returns `totalRecords` (e.g., 5000) but this value is never surfaced to the UI

### Solution

Restructure the search flow so the UI always shows SAM.gov's real total and "Load More" fetches the next batch from SAM.gov.

### Changes

**1. Update `useSyncFromApi` in `src/hooks/useCachedContracts.ts`**
- Return `apiTotal` (the real `totalRecords` from SAM.gov) alongside `synced` count
- Accept a `page` parameter to support fetching subsequent pages

**2. Update `src/pages/SearchHub.tsx` — search flow**
- Track `apiTotal` as a separate state variable (the real SAM.gov total)
- On initial search: call `syncFromApi` (page 0, limit 25), store `apiTotal` from SAM response, then display cached results
- Display: "Showing 25 of 5,000 results" using `apiTotal` instead of `cachedSearch.total`
- **"Load More"** button: increment a `syncPage` counter, call `syncFromApi` with the next page, cache new results, then re-query local cache with increased range to show all accumulated results
- Show "Sync from SAM.gov" button alongside the count to let users explicitly pull fresh data

**3. Update `src/pages/SearchHub.tsx` — keyword search**
- Ensure that when the user types a keyword and hits Enter/Search, the flow always calls `syncFromApi` (not just `cachedSearch.searchLocal`), so live SAM.gov data is fetched for the current query
- Only fall back to cache-only when the user has no search terms and just browsing previously synced data

**4. Update result counter display**
- Change from `cachedSearch.total` to `apiTotal` for the "of X results" display
- Show "Load More" when `cachedSearch.results.length < apiTotal`

### Technical Details

```text
User Flow:
  Search "IT support"
    → syncFromApi(filters, page=0, limit=25) → SAM API returns 25 results + totalRecords=3200
    → cache 25 rows → searchLocal() → display 25
    → UI shows "Showing 25 of 3,200 results"
    
  Click "Load More"
    → syncFromApi(filters, page=1, limit=25) → SAM API returns next 25
    → cache 25 more rows → searchLocal(page range 0-49) → display 50
    → UI shows "Showing 50 of 3,200 results"
```

The SAM.gov API supports `offset` pagination natively (already implemented in the edge function via `params.append("offset", ...)`), so no backend changes are needed.

### Files to Modify
- `src/hooks/useCachedContracts.ts` — return `apiTotal` from sync, support page param properly
- `src/pages/SearchHub.tsx` — new `apiTotal` state, reworked search/load-more flow, always sync on active search

