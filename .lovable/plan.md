

# Codebase Cleanup Plan

## Summary

After a thorough review, I identified **dead code, orphaned files, a legacy `.jsx` file, unused hooks/components, and inconsistent patterns** that should be cleaned up to bring the codebase to a professional standard.

---

## 1. Delete Orphaned Pages (not routed, not imported anywhere)

These page files exist but have **no route in App.tsx** and are **never imported** by any other file. They are leftover from earlier iterations and contain only hardcoded mock data:

- `src/pages/Calendar.tsx` -- replaced by `/dashboard/tracked` redirect
- `src/pages/Documents.tsx` -- replaced by `/dashboard/proposals` redirect
- `src/pages/JourneyHub.tsx` -- replaced by `/dashboard/tracked` redirect
- `src/pages/SavedSearches.tsx` -- replaced by `/dashboard/search` redirect
- `src/pages/CompetitorAnalysis.tsx` -- replaced by `/dashboard/ai` redirect
- `src/pages/MarketWatch.tsx` -- replaced by `/dashboard/ai` redirect
- `src/pages/TeamingPartners.tsx` -- replaced by `/dashboard/ai` redirect
- `src/pages/TrackedCompetitors.tsx` -- not routed, not imported
- `src/pages/WinLossAnalysis.tsx` -- not routed, not imported

**9 files deleted.**

---

## 2. Delete Unused Component

- `src/components/NavLink.tsx` -- not imported anywhere in the project

---

## 3. Delete Unused Hook

- `src/hooks/useCompetitorIntelligence.tsx` -- only imported by the orphaned pages being deleted (`CompetitorAnalysis.tsx`, `TrackedCompetitors.tsx`, `WinLossAnalysis.tsx`)

---

## 4. Convert `.jsx` to `.tsx`

The project is TypeScript throughout except for three legacy `.js/.jsx` files:

- `src/pages/SectorBrowse.jsx` -- rename to `.tsx` and add minimal type annotations
- `src/hooks/useContracts.js` -- rename to `.tsx` and add type annotations
- `src/services/contractsApi.js` -- rename to `.ts` and add type annotations
- `src/store/contractStore.js` -- rename to `.ts` and add type annotations

Update all import references in `App.tsx` and other consumers accordingly.

---

## 5. Clean Up Stale Redirect Routes

The redirect routes in App.tsx reference paths for the deleted pages. These are fine to keep (they protect bookmarked URLs), but I will add a brief comment grouping them and remove the one for `/sectors` since it is already handled. No functional change.

---

## 6. Remove Duplicate Toaster

The app renders **two** toast systems simultaneously: `@/components/ui/toaster` (Radix-based) and `sonner`. Throughout the codebase, **both** `toast()` from `use-toast.ts` and `toast()` from `sonner` are used inconsistently. I will:

- Audit which toast system is dominant (sonner appears more widely used)
- Standardize on **sonner** for all toast calls
- Remove the Radix `<Toaster />` from `App.tsx` and the `useToast` / `toaster` files if fully migrated, OR leave both if migration is too large for this pass and note it for future cleanup

Given the scope, I will **leave both for now** but add a `// TODO: consolidate on sonner` comment to flag it.

---

## 7. Minor Code Quality Fixes

- Remove unused imports in files touched during cleanup
- Ensure consistent spacing in `App.tsx` route definitions (fix the extra space on line 90)
- Add `"use client"` or similar annotations where appropriate (not needed for Vite, skip)

---

## Technical Details

### Files to Delete (12 total)
```text
src/pages/Calendar.tsx
src/pages/Documents.tsx
src/pages/JourneyHub.tsx
src/pages/SavedSearches.tsx
src/pages/CompetitorAnalysis.tsx
src/pages/MarketWatch.tsx
src/pages/TeamingPartners.tsx
src/pages/TrackedCompetitors.tsx
src/pages/WinLossAnalysis.tsx
src/components/NavLink.tsx
src/hooks/useCompetitorIntelligence.tsx
```

### Files to Rename (JS to TS)
```text
src/pages/SectorBrowse.jsx       -> SectorBrowse.tsx
src/hooks/useContracts.js        -> useContracts.ts
src/services/contractsApi.js     -> contractsApi.ts
src/store/contractStore.js       -> contractStore.ts
```

### Files to Edit
- `src/App.tsx` -- update SectorBrowse import extension, fix spacing, add TODO comment on dual toasters
- `src/components/usaspending/AwardExplorer.tsx` -- update contractStore import if path changes

### Risk Assessment
- **Low risk**: All deleted files are confirmed unreachable (no imports, no routes)
- **The `.js` to `.ts` conversion** will use minimal type annotations (`any` where needed) to avoid breaking changes -- a deeper typing pass can follow later

