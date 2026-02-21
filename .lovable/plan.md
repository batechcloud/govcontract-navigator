

## Sector-to-Search Navigation

When a user clicks a sector card on the Sectors page, they should land on the Find Contracts (Search Hub) page with results for that industry already loaded.

### What Already Works
- Sector cards navigate to `/dashboard/search?sector=technology` (etc.)
- The Search Hub has all the search infrastructure (filters, pagination, results display)

### What Needs to Change

**1. SearchHub.tsx -- Read the `sector` query param and auto-search on mount**

- Import `useSearchParams` from `react-router-dom`
- Import the `SECTOR_NAICS` and `SECTOR_CONFIG` mappings (extract them to a shared file, or duplicate the small lookup inline)
- On component mount, check for `?sector=` in the URL
- If present, look up the NAICS codes for that sector, build a `SearchFilters` object with those codes, set the search query to the sector label (e.g. "IT & Cybersecurity"), and call `searchWithFilters()` automatically
- Show a banner or badge indicating the active sector filter so the user knows why results are pre-filtered

**2. Create a shared sector config file**

- Create `src/config/sectors.ts` containing `SECTOR_NAICS`, `SECTOR_CONFIG`, and `SECTOR_COLORS` exports
- Update `SectorBrowse.jsx` to import from this shared file instead of defining them inline
- This avoids duplicating the NAICS mapping

### Technical Details

**New file: `src/config/sectors.ts`**
- Move `SECTOR_NAICS`, `SECTOR_CONFIG`, and `SECTOR_COLORS` constants from `SectorBrowse.jsx` into this shared module with proper TypeScript types

**Changes to `src/pages/SearchHub.tsx`**
- Add `useSearchParams` import and `useEffect` import
- Import `SECTOR_NAICS` and `SECTOR_CONFIG` from the shared config
- Add a `useEffect` that:
  1. Reads `searchParams.get("sector")`
  2. If a valid sector key is found, builds filters with `naics_codes` set to the sector's NAICS array
  3. Sets `searchQuery` to the sector label (e.g. "Construction contracts")
  4. Calls `searchWithFilters(filters, 0)` to trigger the search immediately
  5. Clears the URL param after initiating to avoid re-triggering on re-renders
- Add a sector active indicator badge near the search bar when results are sector-filtered

**Changes to `src/pages/SectorBrowse.jsx`**
- Replace inline constants with imports from `src/config/sectors.ts`
- No other logic changes needed

