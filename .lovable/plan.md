

# Fix Search Filters -- Root Cause Analysis and Corrections

## Problems Found

After tracing the network requests, edge function logs, and SAM.gov API documentation, here are the concrete bugs causing filters to not work:

### Bug 1: Wrong SAM.gov API Parameter Names
The edge function uses incorrect parameter names for the SAM.gov v2 Opportunities API:
- **NAICS**: Code uses `naics` but the API expects `ncode`
- **Notice Type**: Code uses `ntype` but the API expects `ptype`
- **Set-Aside**: Code uses `setaside` but the API expects `typeOfSetAside`
- **PSC/Classification**: The API supports `ccode` natively -- no post-filtering needed

This is why NAICS filtering with "541512" returned 29,121 results (the same as unfiltered) -- SAM.gov silently ignored the unrecognized `naics` parameter.

### Bug 2: PSC _rawPsc Operator Precedence Bug
Line 341 in the edge function has a JavaScript operator precedence error:
```
_rawPsc: opp.psc?.map((p: any) => p.code) || opp.classificationCode ? [opp.classificationCode] : [],
```
This evaluates as `(A || B) ? [B] : []` instead of `A || (B ? [B] : [])`, causing `_rawPsc` to always be `[undefined]` or `[]`. This is why PSC post-filter went from 200 to 0 results every time.

### Bug 3: Agency Name Mismatch
User selects "Department of Defense" but SAM.gov stores it as "DEPT OF DEFENSE" in `fullParentPathName`. The current string comparison `agencyPath.includes("department of defense")` never matches "dept of defense".

## Fix Plan

### File 1: `supabase/functions/sam-search/index.ts`

**Fix parameter names:**
- Change `params.append("naics", ...)` to `params.append("ncode", ...)`
- Change `params.append("ntype", ...)` to `params.append("ptype", ...)`
- Change `params.append("setaside", ...)` to `params.append("typeOfSetAside", ...)`
- Add `params.append("ccode", ...)` for PSC codes (use native API filtering instead of post-filtering)

**Fix PSC extraction (line 341):**
```typescript
// Before (broken):
_rawPsc: opp.psc?.map((p: any) => p.code) || opp.classificationCode ? [opp.classificationCode] : [],

// After (fixed):
_rawPsc: opp.psc?.map((p: any) => p.code) || (opp.classificationCode ? [opp.classificationCode] : []),
```

**Fix agency matching:**
Add abbreviation mapping so "Department of Defense" also matches "DEPT OF DEFENSE":
```typescript
const AGENCY_ABBREVIATIONS: Record<string, string[]> = {
  "department of defense": ["dept of defense", "dod"],
  "department of homeland security": ["dept of homeland security", "dhs"],
  // ... etc
};
```

**Remove unnecessary post-filtering:**
Since NAICS, PSC (`ccode`), set-aside, notice type, and state can all be handled by SAM.gov natively, only agency and value range need post-filtering. This means `needsPostFilter` triggers less often, improving pagination accuracy.

### File 2: `src/pages/SearchHub.tsx`
No additional changes needed -- the `buildCombinedFilters()` logic from the previous fix is correct. The filters were being combined properly on the client side; they just weren't being applied on the server side due to wrong parameter names.

### File 3: `src/services/contractsApi.js`
No additional changes needed -- it already passes filters in the correct `SearchFilters` format.

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| NAICS param | `naics` (ignored) | `ncode` (works) |
| PSC param | Post-filter only (broken) | `ccode` native + post-filter fallback |
| Notice type param | `ntype` (ignored) | `ptype` (works) |
| Set-aside param | `setaside` (ignored) | `typeOfSetAside` (works) |
| PSC extraction | Operator precedence bug | Fixed with parentheses |
| Agency matching | Exact substring (fails) | Abbreviation-aware matching |
| Post-filter scope | Always for PSC/agency | Only for agency + value range |

Only one file needs editing: `supabase/functions/sam-search/index.ts`. The edge function will be redeployed after changes.

