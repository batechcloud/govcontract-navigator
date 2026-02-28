

## Problem: Multiple Quick Filters Return No Results

**Root cause**: Two issues in the SAM.gov set-aside mapping (`supabase/functions/sam-search/index.ts`):

1. **Missing set-aside code mappings** — The `setAsideMapping` object at line 223 is missing entries for `"VOSB"`, `"EDWOSB"`, and `"SDB"`. When these are part of the active filters, they pass through unmapped to SAM.gov, which may not recognize them and returns zero results.

2. **No keyword fallback for filter-only searches** — When no search query is entered but filters are active, `keywords` is empty. SAM.gov may need at least a broad query or the API call structure needs adjustment to handle filter-only requests properly.

### Changes

**`supabase/functions/sam-search/index.ts`**
- Add missing set-aside code mappings:
  - `"VOSB"` → `"VOSBC"` (Veteran-Owned Small Business Concern)
  - `"EDWOSB"` → `"EDWOSB"` (Economically Disadvantaged WOSB)
  - `"SDB"` → `"SBP"` (Small Disadvantaged Business maps to Small Business Program)
- Ensure that when `keywords` is empty but `set_aside` filters are present, the API call still proceeds without a `q` parameter (just using `typeOfSetAside` alone)

**`src/pages/SearchHub.tsx`**
- No changes needed — the client-side filter building logic is correct; the issue is server-side mapping

**Deploy** the updated `usaspending-search` and `sam-search` edge functions after changes.

