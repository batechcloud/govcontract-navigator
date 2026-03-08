

## Problem

Quick filters don't work because of a **set-aside code mismatch**:

- SAM.gov API returns raw codes: `SBP`, `SDVOSBC`, `SBA`, `HZC`, `WOSB`, `EDWOSB`, `VOSBC`
- These raw codes get stored in `cached_contracts.set_aside`
- Quick filters search for friendly labels: `Small Business`, `SDVOSB`, `8(a)`, `HUBZone`
- The Supabase `.in()` query finds zero matches

## Solution

Normalize set-aside values at two points to ensure consistency:

### 1. Edge function: Normalize on output (sam-search/index.ts)

Add a reverse mapping from SAM codes to friendly labels in the `mapOpportunity` function:

```
SAM Code → Friendly Label
SBP      → Small Business
SBA      → 8(a)
SDVOSBC  → SDVOSB
VOSBC    → VOSB
HZC      → HUBZone
WOSB     → WOSB (already matches)
EDWOSB   → EDWOSB (already matches)
```

Change line 449 to map `opp.typeOfSetAside` through this reverse mapping before returning.

### 2. Cache hook: Broader matching (useCachedContracts.ts)

Update `searchLocal` to also match raw SAM codes when filtering by set-aside. Build an expanded list that includes both the friendly label AND the raw SAM code for each filter value. This provides backward compatibility for already-cached data with raw codes.

```
When filter has ["Small Business"], query with ["Small Business", "SBP"]
When filter has ["SDVOSB"], query with ["SDVOSB", "SDVOSBC"]
```

### 3. Also normalize in useSyncFromApi upsert (useCachedContracts.ts)

Apply the same reverse mapping when writing `set_aside` during upsert, so new cached data always has friendly labels.

### 4. sam-refresh-single edge function

Apply the same normalization to the single-contract refresh endpoint.

### Files Changed
- `supabase/functions/sam-search/index.ts` — add reverse mapping in `mapOpportunity`
- `supabase/functions/sam-refresh-single/index.ts` — same normalization
- `src/hooks/useCachedContracts.ts` — expand set-aside filter values + normalize on upsert

