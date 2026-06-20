## Why pages load slowly

I profiled the database (pg_stat_statements) and the client. Page load time is dominated by a handful of slow Supabase queries, not by the React bundle. The two biggest offenders:

| Query | Calls | Mean | Max |
|---|---|---|---|
| `sam_opportunities_compat` filtered by `deadline > now()` ordered by `deadline, match_score` | 10 | **1,479 ms** | **5,876 ms** |
| `contracts` ilike on title/description/agency + deadline | 3 | 1,887 ms | 2,874 ms |
| `usaspending_awards` filtered by `date_signed` range + `set_aside IN (...)` | 148 | 82 ms | 664 ms |
| `SELECT * FROM contracts LIMIT/OFFSET` with `count: 'exact'` | 1,336 | 54 ms | 1,770 ms |

Root causes:

1. **`sam_opportunities` is missing a `deadline` index.** The user-facing search reads through the `sam_opportunities_compat` view and filters/sorts by `deadline` — every call does a sequential scan + sort over the full table. This is the single biggest hit on Dashboard / Search / Sector pages.
2. **`sam_opportunities` is missing `set_aside`, `value`, and a composite `(deadline, match_score)` index** that matches the default sort.
3. **`usaspending_awards` is missing a `set_aside` index** used by the USASpending intel page.
4. **Every list query uses `count: 'exact'`**, which forces Postgres to scan the entire table to produce a total row count even when the page only needs 20 rows. On the `contracts` / `sam_opportunities` tables this is the main source of the long tail (max latencies > 1.5 s).
5. Minor: the Dashboard `AIRecommendationsCard` and `useProfile` both kick off network work on mount; they're already cached via React Query persist, so no change needed there.

## Plan

### 1. Add missing indexes (migration)

```sql
CREATE INDEX IF NOT EXISTS sam_opportunities_deadline_idx
  ON public.sam_opportunities (deadline);

-- Matches default sort: deadline ASC NULLS LAST, match_score DESC NULLS LAST
CREATE INDEX IF NOT EXISTS sam_opportunities_deadline_score_idx
  ON public.sam_opportunities (deadline ASC NULLS LAST, match_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS sam_opportunities_set_aside_idx
  ON public.sam_opportunities (set_aside);

CREATE INDEX IF NOT EXISTS sam_opportunities_value_idx
  ON public.sam_opportunities (value);

CREATE INDEX IF NOT EXISTS usaspending_awards_set_aside_idx
  ON public.usaspending_awards (set_aside);

ANALYZE public.sam_opportunities;
ANALYZE public.usaspending_awards;
```

Tradeoff: ~20–40 MB extra storage and a small (<5 %) slowdown on inserts during the nightly sync, in exchange for ~10–50× faster reads on every page that lists opportunities.

### 2. Stop requesting exact counts on hot paths

Change the list queries from `select("*", { count: "exact" })` to `{ count: "estimated" }` (or drop `count` entirely where the UI only needs "more results available"). Files:

- `src/hooks/useSearch.tsx` — main search list
- `src/hooks/useCachedContracts.ts` — dashboard / sector cards
- `src/lib/contracts-query.ts` — shared builder
- `src/hooks/useUSASpending.tsx` — USASpending list

Where the UI shows a real total (e.g. "1,284 results"), keep `count: 'exact'` but issue it as a separate, debounced query so the first page renders immediately.

### 3. Verify

After the migration runs:

1. Re-run `EXPLAIN (ANALYZE, BUFFERS)` on the `sam_opportunities_compat` query with a real `now()` value to confirm the new `(deadline, match_score)` index is used (Index Scan, not Seq Scan + Sort).
2. Reload `/dashboard`, `/dashboard/search`, and `/dashboard/sectors` and confirm first-paint and "results visible" times drop noticeably.
3. Re-check `supabase--slow_queries` after a few minutes of normal use; the `sam_opportunities_compat` entry should disappear from the top of the list.

## Out of scope

- No changes to bundle splitting, lazy loading, or the React Query persist layer — those are already configured correctly.
- No schema changes to `contracts` (it already has trigram + tsvector indexes); only the count-mode change applies there.
- No edge-function changes; the SAM/USASpending sync paths are unaffected aside from a marginal write cost from the new indexes.
