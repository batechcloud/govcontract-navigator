

## Fix Quick Filters for Both Prime Contracts and Subcontracts Tabs

### Issues Found

1. **"Clear all" button doesn't reset results** (line 761): Sets `activeFilters` to `[]` but never re-triggers a search, so old filtered results remain on screen.

2. **Removing last quick filter shows nothing** (line 524): The condition `if (newActiveFilters.length > 0 || searchQuery.trim() || hasAdvancedFilters)` prevents any search when all filters are cleared, so stale results stay visible instead of showing all cached contracts.

3. **Tab switching doesn't re-apply filters**: When switching between Prime and Subcontracts, the active quick filters aren't re-applied to the new tab's data source.

### Changes

**File: `src/pages/SearchHub.tsx`**

1. **Fix "Clear all" button** — After setting `activeFilters` to `[]`, call `cachedSearch.searchLocal` with empty filters to show all cached results (or trigger a subaward search with no filter keyword if on subcontracts tab).

2. **Fix quick filter removal** — Remove the guard condition on line 524. When `newActiveFilters` is empty and there's no search query, run `cachedSearch.searchLocal` with empty filters to reset to the full cached list.

3. **Re-search on tab switch** — Add an effect or handler on `activeTab` change that re-runs the appropriate search (cache search for prime, subaward search for subcontracts) with the current filters and search query applied.

### Summary of Edits

- `src/pages/SearchHub.tsx`:
  - Line ~761: "Clear all" click handler calls search reset
  - Line ~524: Remove the `if` guard so clearing all filters triggers a full cache reload
  - Tab `onValueChange` handler: re-apply current filters/query to the newly active tab

