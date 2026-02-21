

# Fix "Find Contracts" Search Logic

## Problems Identified

After reviewing the codebase, there are several interconnected issues causing the search to return incorrect or inconsistent results:

### 1. Filters Don't Combine Properly
When you use the search bar and then apply advanced filters (or quick filters), they don't merge together. Each action builds its own filter set from scratch, ignoring the others:
- **Quick Filters** ignore advanced filter selections (NAICS, PSC, Agency, Location, etc.)
- **Advanced Filters** split your search query into words (dropping short words like "IT" or "AI") instead of preserving it properly
- **Search bar** uses AI parsing that may override your manual filter choices

### 2. PSC and Agency Filters Are Unreliable
PSC codes and agency names are appended to the keyword search query (`q`) as plain text rather than using proper API parameters. This pollutes the search, returning unrelated results that happen to mention those words.

### 3. Pagination Breaks After Filtering
When location or value post-filtering is applied, the pagination offset is sent to SAM.gov before filtering happens, so page 2+ can show wrong or empty results.

### 4. Two Separate Search Systems
The app has two independent search systems that work differently:
- **SearchHub** (Find Contracts page) uses `useSearch.tsx` calling the `sam-search` edge function
- **Dashboard/SectorBrowse** uses `useContracts.js` + `contractsApi.js` calling the same edge function but with a different filter format

This means the same contract can appear differently depending on which page you're on.

---

## Fix Plan

### Step 1: Fix Filter Merging in SearchHub
Update `SearchHub.tsx` so that **all three filter sources** (search bar keywords, quick filters, and advanced filters) are always combined into a single unified filter object before any search is executed.

- Create a `buildCombinedFilters()` helper that merges search keywords, active quick filters, and all advanced filter values
- Use this helper in `handleSearch`, `handleQuickFilter`, and `handleApplyAdvancedFilters`
- Preserve short keywords like "IT" and "AI" (remove the `filter(w => w.length > 2)` restriction)

### Step 2: Fix PSC and Agency Filtering in the Edge Function
Update `sam-search/index.ts` to stop appending PSC codes and agency names to the keyword query:

- **PSC codes**: Use SAM.gov's `ptype` parameter (for product/service type) or perform reliable post-filtering on results
- **Agency names**: Use SAM.gov's `organizationId` parameter where possible, or perform post-filtering on the `fullParentPathName` field rather than polluting keywords
- Keep the keyword `q` parameter reserved for actual user search terms only

### Step 3: Fix Pagination for Post-Filtered Results
Update the edge function to handle pagination correctly when post-filtering:

- Always fetch from offset 0 when post-filtering is needed
- Apply post-filters first, then paginate the filtered results
- Return accurate total counts based on filtered (not raw) results

### Step 4: Unify the Search Interface
Update `contractsApi.js` (used by Dashboard) to use the same `SearchFilters` format as `useSearch.tsx`, so both pages send identical filter structures to the `sam-search` edge function.

- Map the old filter format (`keyword`, `sector`, `setAside`) to the new format (`keywords[]`, `naics_codes[]`, `set_aside[]`)
- Remove duplicate client-side filtering that's now handled server-side

---

## Technical Details

### Files to modify:
- `src/pages/SearchHub.tsx` -- unified filter builder, fix all three search paths
- `supabase/functions/sam-search/index.ts` -- fix PSC/agency handling, fix pagination
- `src/services/contractsApi.js` -- align filter format with SearchFilters interface
- `src/hooks/useContracts.js` -- remove redundant client-side filtering now done server-side

### No database changes required.

