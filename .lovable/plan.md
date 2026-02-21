

# Add Complete NAICS Code Database (1,000+ Codes)

## Overview
Add all NAICS codes from the SBA Table of Size Standards to the application. The current selector has 68 codes -- this will expand it to the full ~1,057 codes across 20 NAICS sectors, matching the official SBA document.

## Architecture Decision
Given the volume of data (~1,000+ entries), the NAICS code data will be moved to a dedicated data file (`src/data/naicsCodes.ts`) rather than keeping it inline in the component. This keeps the component clean and makes the data reusable across the app.

## Changes

### 1. Create `src/data/naicsCodes.ts` -- New File
A comprehensive data file containing all NAICS codes organized into 20 sector groups, extracted directly from the SBA Table of Size Standards (March 17, 2023):

- **Sector 11** -- Agriculture, Forestry, Fishing & Hunting (~60 codes)
- **Sector 21** -- Mining, Quarrying, Oil & Gas (~20 codes)
- **Sector 22** -- Utilities (~15 codes)
- **Sector 23** -- Construction (~35 codes)
- **Sector 31-33** -- Manufacturing (~400 codes, the largest sector)
- **Sector 42** -- Wholesale Trade (~60 codes)
- **Sector 44-45** -- Retail Trade (~40 codes)
- **Sector 48-49** -- Transportation & Warehousing (~50 codes)
- **Sector 51** -- Information (~25 codes)
- **Sector 52** -- Finance & Insurance (~35 codes)
- **Sector 53** -- Real Estate & Rental/Leasing (~25 codes)
- **Sector 54** -- Professional, Scientific & Technical Services (~50 codes)
- **Sector 55** -- Management of Companies (~2 codes)
- **Sector 56** -- Administrative & Support Services (~45 codes)
- **Sector 61** -- Educational Services (~20 codes)
- **Sector 62** -- Health Care & Social Assistance (~45 codes)
- **Sector 71** -- Arts, Entertainment & Recreation (~25 codes)
- **Sector 72** -- Accommodation & Food Services (~15 codes)
- **Sector 81** -- Other Services (~30 codes)
- **Sector 92** -- Public Administration (note: no SBA size standards, but included for contract search)

Each entry will include: `code` (6-digit), `desc` (industry description), and optionally `sizeStandard` (for future use).

### 2. Update `src/components/company/NaicsCodeSelector.tsx`
- Import NAICS groups from the new data file instead of defining them inline
- Increase the dropdown max-height from 300px to 400px for better browsing
- Add a count indicator showing how many codes are available in each group
- The existing search, add, and remove functionality remains unchanged -- the `cmdk` Command component handles filtering efficiently even with 1,000+ items

## Performance Considerations
- The `cmdk` library (Command component) already handles virtualized filtering efficiently
- Search is instant because `cmdk` filters on the client side using the `value` prop
- Only visible items are rendered in the DOM thanks to CommandList's built-in scroll behavior
- No API calls or lazy loading needed -- the full dataset is ~80KB which is negligible

## Technical Details

```text
New file:
  src/data/naicsCodes.ts
    - Exports NAICS_GROUPS: Array<{ label: string; codes: Array<{ code: string; desc: string }> }>
    - Exports ALL_NAICS: flattened array of all codes
    - ~1,057 NAICS codes across 20 sector groups

Modified file:
  src/components/company/NaicsCodeSelector.tsx
    - Remove inline NAICS_GROUPS constant
    - Import { NAICS_GROUPS, ALL_NAICS } from "@/data/naicsCodes"
    - Increase CommandList max-height to 400px
```

