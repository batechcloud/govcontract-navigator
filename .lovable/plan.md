## Goal

On `/dashboard/search` (Find Contracts):
1. Replace the single "Load More" button with **numbered pagination** so users can jump to page 2/3/N without scrolling through everything.
2. **Audit every filter** end-to-end (UI state → `buildCombinedFilters` → `useCachedSearch.searchLocal` → `applyContractFilters` SQL) and fix any that don't actually constrain results.

## Part 1 — Pagination

Today the Prime tab uses an accumulating "Load More" that keeps growing `results.length` and re-queries with a bigger `limit`. We'll switch to fixed-page navigation against the `sam_opportunities_compat` view.

**Behavior**
- Page size: 25 (same as today).
- Show pager when `cachedSearch.total > 25`: `‹ Prev | 1 2 3 … N | Next ›` plus "Page X of Y · 1,234 results".
- Window of 5 numeric buttons centered on current page, with first/last + ellipses.
- Clicking a page calls `cachedSearch.searchLocal(filters, page, 25)` and **scrolls the result list to the top** (no auto-append).
- Page resets to 1 whenever filters, quick filters, sort, or the search query change (already partly handled via `setCurrentPage(0)`; we'll route every reset through one helper).
- Disable Prev on page 1, Next on last page; disable all while `isSearching`.
- Keep `?page=` in the URL so refresh / back button work.

**Files**
- `src/pages/SearchHub.tsx` — remove the "Load More" block (~lines 1271–1290), add a new `<Pagination>` component instance; wire `currentPage` to drive `searchLocal`; remove `syncPage`/`handleLoadMoreFromApi`; centralize page resets.
- `src/components/search/ResultsPagination.tsx` (new) — small numbered pager built on existing shadcn `pagination` primitive in `src/components/ui/pagination.tsx`.
- `src/hooks/useCachedContracts.ts` — no API change; already supports `page` arg.

Subcontracts tab keeps its existing "Load more" (USASpending API uses cursor-style paging and doesn't return a stable total in the same way — out of scope for this pass unless you want it too).

## Part 2 — Filter accuracy audit

Walk every filter in the panel and confirm it round-trips correctly. Known/likely issues to verify and fix:

1. **Active-only / Expiring-soon / New-this-week** — confirmed wired in `useCachedSearch` (lines 101–112). ✅ verify chip removal also resets page.
2. **Quick filters (`handleQuickFilter`)** — builds its own `combinedFilters` object and **does not pass `matchMyProfile` / profile NAICS merge**, so toggling a quick chip silently drops the "My industry" filter. Fix: route quick filters through `buildCombinedFilters()` like Apply does, then overlay the quick set-aside/type.
3. **Set-aside expansion** — `applyContractFilters` uses `expandSetAsideFilter` + `.in("set_aside", …)`. Verify the family map in `src/lib/contracts-query.ts` covers every label the UI offers in `FilterSection` (Small Business, 8(a), WOSB, EDWOSB, HUBZone, SDVOSB, VOSB) and that picking "Small Business" actually returns the full family (it does via the family map — confirm no labels missing).
4. **NAICS prefix filter** — codes <6 digits use `like.{code}*`. Verify sector tiles still match (e.g. `54` → `541xxx`).
5. **Agency filter** — uses ILIKE on both `agency` and `parent_agency`. Confirm dropdown values aren't being sent with trailing whitespace/commas that the sanitizer drops.
6. **Min/Max value + Budget preset** — Budget preset overrides advMin/Max; verify `null` vs `0` handling (a `min_value: 0` would no-op `.gte`, currently fine because of `if (filters.min_value)`).
7. **Deadline ≤ N days** — sent as `deadline_before` ISO; confirmed `.lt("deadline", …)`. ✅
8. **Location/State** — ILIKE on `location` only. Confirm the UI label matches what's in `location` column (e.g. "TX" vs "Texas") — may need to OR against raw place-of-performance fields. Will inspect actual values via `psql` before deciding.
9. **Opportunity type vs Contract type** — UI has both `advType` and `advContractType`; only `advType` is sent as `opportunity_type` → ILIKE on `contract_type`. `advContractType` chip exists but is **never sent to the query** — bug. Fix: either drop the duplicate UI field or merge it into the filter payload.
10. **"Match my industry" + manual NAICS** — confirmed manual selection overrides profile. ✅
11. **Sort change** — resets page (already handled). Verify after pagination refactor.
12. **PSC codes** — `.in("psc_code", …)` — exact match only. Confirm UI sends 4-char codes that match column format.

For each issue found, the fix is a small targeted edit in `SearchHub.tsx` (filter payload) or `src/lib/contracts-query.ts` (SQL translation). I'll run a couple of `psql` queries on `sam_opportunities` to sample real column values for `location`, `contract_type`, and `set_aside` before finalizing #5, #8, #9.

## Out of scope

- Subcontracts tab pagination.
- AI/NL search path (`useSmartSearch`) — unused on this screen for filter searches.
- Server-side performance tuning (existing GIN indexes are fine for 25-row pages).

## Deliverable

- Numbered pager on Find Contracts.
- Filter audit doc (inline in chat) listing each filter, what was broken, and the fix applied.
- All changes verified by clicking through pages and toggling each filter in the preview.
