

# Load New Batch of SAM.gov Opportunities

## Overview
Add a "Load New Batch" button to the Search Hub that fetches the next set of SAM.gov results (leveraging the API's offset parameter), and visually flag any result that is already saved in the user's tracked contracts.

## What Changes

### 1. Edge Function: `sam-search/index.ts`
- Currently the `limit` parameter sent to SAM.gov caps at around 200 (or 10 without post-filter). The SAM.gov API supports up to 1000 per call via its `limit` and `offset` parameters.
- Increase the default fetch limit to allow larger batches (e.g., 25 per page in the UI) and ensure the `offset` parameter properly maps so that requesting page 0, 1, 2... returns different result sets.
- No major structural change needed -- the existing `page` and `limit` params already flow through. We just need to make sure higher page numbers work correctly for the non-post-filtered path.

### 2. Search Hook: `useSearch.tsx`
- Add a `loadNextBatch` function that increments the page and fetches the next set of results while **appending** them to the existing results (rather than replacing).
- Track a `currentBatchPage` counter so each "Load New Batch" click fetches the next offset.
- Expose `loadNextBatch`, `hasMore` (based on total vs loaded count), and `batchLoading` state.

### 3. Search Hub UI: `SearchHub.tsx`
- Add a prominent "Load New Batch" button (with a refresh icon) below the results list, visible when there are more results available from SAM.gov.
- Show a count like "Showing 25 of 1000 opportunities" to communicate progress.
- For each result card, cross-reference the `trackedIds` Set (already computed from `useTrackedContracts`) against `result.id`. If the contract is already tracked, display an "Already Tracked" badge on the card and disable/change the Track button to say "Already Tracked".

### 4. "Already Tracked" Indicator
- The `trackedIds` Set already exists in SearchHub (line 267: `const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || [])`).
- Currently the Track button is only shown when `!trackedIds.has(result.id)`. We will instead always show the button area but render "Already Tracked" with a checkmark icon and muted styling when the contract is already in the pipeline.

## Technical Details

**useSearch.tsx changes:**
- Add `allResults` state that accumulates across batches
- `loadNextBatch()` calls `searchContracts.mutateAsync` with incremented page, appends to `allResults`
- `search()` and `searchWithFilters()` reset `allResults` and batch counter
- Expose `loadNextBatch`, `hasMore`, `isLoadingBatch`

**SearchHub.tsx changes:**
- Replace the existing pagination with a "Load More Results" button approach (or keep pagination but add "Load New Batch" as an additional action)
- Add `Already Tracked` badge with green checkmark icon on tracked cards
- Change the Track button to show "Tracked" with disabled state for already-tracked items

**sam-search edge function:**
- Ensure offset calculation `page * limit` works correctly for pages beyond 0 when not post-filtering
- The current code already does this at line 121: `params.append("offset", needsPostFilter ? "0" : (page * limit).toString())`
- For post-filtered results, increase the fetch window proportionally when requesting later pages

## User Experience
- User searches for contracts as usual
- Results load (first batch of ~10-25)
- At the bottom of results, a "Load New Batch" button appears showing how many more are available
- Clicking it fetches the next set and appends below existing results
- Any contract already in the user's tracked pipeline shows a green "Already Tracked" badge
- The Track button for those items changes to a muted "Already Tracked" state with a checkmark

