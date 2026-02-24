

## Add Price Range Quick Filter to Search

### Problem
The price range filter currently exists but is hidden inside the collapsible "Advanced Filters" panel. You want it more accessible without having to open advanced filters.

### Solution
Add a "Price Range" dropdown directly in the quick filters row (next to Small Business, Veteran-Owned, etc.) so you can filter by contract value with one click.

### Design
A Select dropdown will appear at the end of the quick filter badges, styled consistently with the existing UI. It will show predefined ranges:
- Any Price (default)
- Under $25K
- $25K - $100K
- $100K - $500K
- $500K - $1M
- $1M - $5M
- $5M - $25M
- Over $25M

Selecting a range immediately triggers a search (same behavior as clicking a quick filter badge). The dropdown shows a DollarSign icon and highlights when a range is active.

### Changes

**File: `src/pages/SearchHub.tsx`**

1. In the quick filters row (around line 553-579), add a price range Select dropdown between the quick filter badges and the "Advanced Filters" button
2. When a price range is selected, update `advMinValue` and `advMaxValue` (reusing the existing state) and auto-trigger the search
3. The dropdown will be styled compactly to match the badge row aesthetic
4. When a price range is active via the quick dropdown, it syncs with the advanced filter value so they stay consistent

### Technical Details

The new dropdown will:
- Use the existing `valueRanges` array (already defined at line 136)
- Set `advMinValue` / `advMaxValue` state (already wired into `buildCombinedFilters`)
- Call `searchWithFilters(buildCombinedFilters(), 0)` on change to immediately apply
- Show a DollarSign icon and accent border when a range is selected
- Appear as a compact Select component in the quick filters row, before the "Advanced Filters" button

No backend changes needed -- the edge function already handles `min_value` and `max_value` post-filtering.
