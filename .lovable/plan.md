

## Plan: Add Subcontracting Opportunities Tab to Find Contracts

### Data Source
USASpending.gov's `/api/v2/search/spending_by_award/` endpoint supports a `subawards: true` parameter that returns subaward/subcontract data. This is a free API (no key required) and is already integrated via the `usaspending-search` edge function. We'll add a new action to that function to search subawards.

### Implementation Steps

**1. Extend the `usaspending-search` edge function** with a new `search_subawards` action that calls `/api/v2/subawards/` (dedicated subaward endpoint) with keyword, agency, date range, and value filters. Returns fields like Subaward Number, Subawardee Name, Amount, Description, Prime Award ID, Prime Recipient, Action Date, and Place of Performance.

**2. Create a `useSubawardSearch` hook** in `src/hooks/useSearch.tsx` (or a new file) that wraps the mutation call to `usaspending-search` with `action: "search_subawards"`. Includes caching similar to the existing `useSearchContracts` hook. Returns results in a `SubawardResult` interface with fields: id, subawardNumber, primeAwardId, primeRecipient, subawardee, amount, description, actionDate, placeOfPerformance, agency.

**3. Add tabs to SearchHub.tsx** using the existing `Tabs` component:
- **Tab 1: "Prime Contracts"** (default) — current SAM.gov search behavior, unchanged
- **Tab 2: "Subcontracts"** — triggers subaward search via USASpending

The search bar, quick filters, and advanced filters remain shared. When the user is on the Subcontracts tab, searches hit the USASpending subawards endpoint instead of SAM.gov. Results render in a similar card layout but with subcontract-specific fields (prime contractor, subawardee, subaward amount).

**4. Subcontract result cards** will show:
- Subawardee name and prime contractor
- Award amount, action date
- Awarding agency, place of performance
- Link to USASpending award page
- Track/bookmark action (reuses existing tracking)

### Technical Details

**USASpending Subawards API:**
```
POST https://api.usaspending.gov/api/v2/subawards/
{
  "page": 1,
  "limit": 25,
  "sort": "amount",
  "order": "desc",
  "award_id": null,  // optional
  "keyword": "cybersecurity"
}
```

Alternatively, `/api/v2/search/spending_by_award/` with `"subawards": true` can return subaward data inline. We'll use the dedicated `/api/v2/subawards/` endpoint for broader keyword search or fall back to `spending_by_award` with subawards toggle depending on which provides better filtering.

**Files to modify:**
- `supabase/functions/usaspending-search/index.ts` — add `search_subawards` action
- `src/hooks/useSearch.tsx` — add `SubawardResult` interface and `useSubawardSearch` hook
- `src/pages/SearchHub.tsx` — add Tabs wrapping Prime/Subcontract views, state for active tab, conditional rendering of results

**No database changes required.**

