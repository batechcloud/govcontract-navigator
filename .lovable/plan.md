

## Fix: AI Picks Navigation

### Problem
When you click on AI-generated picks, they link to `/dashboard/search?q=...`, but the Search Hub page only reads the `sector` query parameter — it completely ignores the `q` parameter. So the page loads blank with no search triggered.

### Solution
Add support for the `q` query parameter in SearchHub so that when you arrive from an AI pick, the search query is pre-filled and automatically executed.

### Changes

**File: `src/pages/SearchHub.tsx`**

Add a new `useEffect` (similar to the existing sector auto-search) that:
1. Reads `searchParams.get("q")`
2. If present, sets `searchQuery` to that value
3. Triggers `handleSearch()` automatically with the query as keywords
4. Clears the param from the URL to prevent re-triggering

This will be placed right after the existing sector auto-search effect (~line 284), using a similar ref guard pattern to prevent double-execution.

```typescript
// Auto-search when arriving with ?q= param (e.g. from AI Picks)
const qSearchDone = useRef(false);

useEffect(() => {
  const q = searchParams.get("q");
  if (!q || qSearchDone.current) return;
  qSearchDone.current = true;

  setSearchQuery(q);
  const filters = {
    keywords: q.split(/\s+/).filter(Boolean),
    naics_codes: [],
    psc_codes: [],
    set_aside: [],
    agencies: [],
    min_value: null,
    max_value: null,
    location: null,
    opportunity_type: null,
  };
  searchWithFilters(filters, 0);
  setSearchParams({}, { replace: true });
}, [searchParams]);
```

No changes needed to `AIRecommendationsCard.tsx` — the links it generates are already correct; they just need the Search Hub to actually handle the `q` parameter.

