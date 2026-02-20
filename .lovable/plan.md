

## Add Contracts Hook, Store, and Sector Browse Page

### Overview
Add three new files and wire up routing for a Sector Browse page that lets users explore government contracts by industry category.

### Important Compatibility Notes

There are several issues with the provided files that need to be addressed for them to work in this project:

1. **Missing dependency**: `zustand` is not installed -- it's required by `contractStore.js`. It will be added to the project.
2. **Missing service file**: `useContracts.js` imports `fetchAllContracts` from `../services/contractsApi`, but this file does not exist anywhere in the project. A stub implementation will be created so the hook falls back to its built-in mock data gracefully.
3. **File extensions**: The project uses TypeScript (`.tsx`/`.ts`), but the provided files are `.js`/`.jsx`. They will be created as-is per your request -- Vite handles `.js`/`.jsx` files fine alongside TypeScript.
4. **`axios` is not needed**: The provided files don't use axios, and the project uses `fetch` / Supabase client. It will not be installed.

### Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/hooks/useContracts.js` | Hook for contract fetching, filtering, sorting, pagination, and save/unsave |
| 2 | `src/store/contractStore.js` | Zustand store with persistence for saved contracts, notes, statuses, and CSV export |
| 3 | `src/pages/SectorBrowse.jsx` | Visual grid page for browsing contracts by 24 industry sectors |
| 4 | `src/services/contractsApi.js` | Stub service file so `useContracts.js` import resolves (returns empty array, triggering mock data fallback) |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add import for `SectorBrowse` and a `/sectors` route |
| `package.json` | Install `zustand` dependency |

### Technical Details

- **contractsApi stub**: Will export a `fetchAllContracts` function that returns an empty array. This ensures the hook's `catch` block activates and serves the 25 built-in mock contracts. You can later replace this with a real SAM.gov/USASpending API call.
- **Route placement**: `/sectors` will be added as a public route (no `ProtectedRoute` wrapper), matching the pattern of other informational pages. If you'd prefer it protected, that can be adjusted.
- **Zustand**: Installed as a production dependency. The store uses `persist` middleware to save contracts to `localStorage` under the key `govcontract-store`.
- **All three user-provided files will be created exactly as specified**, with the single addition of the `contractsApi.js` stub to prevent a build error.

