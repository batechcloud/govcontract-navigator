

## Plan: Add "Posted Date (Newest)" Sort Option

### Changes Required

**Two files need modification:**

### 1. `src/hooks/useCachedContracts.ts`

- **Line 110**: Expand the `SortOption` type to include `"posted_date"`:
  ```ts
  export type SortOption = "match_score" | "deadline" | "value" | "posted_date";
  ```

- **Lines 167-179**: Add a new sorting branch in `searchLocal` for the `posted_date` option, ordering by `posted_date DESC` (newest first) with `match_score DESC` as a tiebreaker, nulls pushed to the end:
  ```ts
  } else if (effectiveSort === "posted_date") {
    query = query
      .order("posted_date", { ascending: false, nullsFirst: false })
      .order("match_score", { ascending: false, nullsFirst: false });
  }
  ```

### 2. `src/pages/SearchHub.tsx`

- **Line 941** (inside the sort `<Select>`): Add a new `<SelectItem>` after the "Value (Highest)" option:
  ```tsx
  <SelectItem value="posted_date">Posted Date (Newest)</SelectItem>
  ```

### Why This Works
- The `posted_date` column already exists in the `cached_contracts` table and is populated during SAM.gov sync (line 260 in useCachedContracts.ts).
- The existing `useEffect` on `cachedSearch.currentSort` (SearchHub lines 407-419) will automatically re-query when the new sort is selected.
- No database migration needed.

