

# NAICS Code Validation Report

## Summary

After cross-referencing the SBA's official Table of Size Standards (effective March 17, 2023) against the two files that contain NAICS codes in your application, I found **several codes that need updating** due to the 2022 NAICS revision. The issues fall into two categories.

---

## File 1: `src/config/sectors.ts` (SECTOR_NAICS — 4-digit prefixes)

These prefixes are used for sector-based filtering on the Search Hub and Sector Browse pages.

### Issues Found

| Sector | Current Code | Problem | Correct Code | Notes |
|--------|-------------|---------|-------------|-------|
| technology | `"5112"` | Old prefix for Software Publishers (was 511210) | `"5132"` | Now 513210 per 2022 revision |
| technology | `"5179"` | No matching NAICS codes exist | Remove | No 5179xx codes in 2022 NAICS |
| technology | `"5191"` | Maps to Libraries (519210), not Web/Info Services | `"5192"` | Web Search Portals is 519290 |
| marketing | `"5191"` | Same issue as above | `"5192"` | 519290 is the target code |
| data_analytics | `"5191"` | Same issue as above | `"5192"` | 519290 is the target code |
| telecom | `"5171"` | Valid (maps to 517111 Wired Carriers) | OK | Keep |
| telecom | `"5172"` | Valid (maps to 517121 Resellers) | OK | Keep |
| telecom | `"5174"` | Valid (maps to 517410 Satellite) | OK | Keep |
| telecom | `"5179"` | No matching NAICS codes exist | `"5178"` | 517810 = All Other Telecom |
| scientific | `"7132"` | Maps to Amusement Parks/Arcades, not scientific | Remove or replace | Not a scientific category |
| scientific | `"8099"` | Does not exist in NAICS at all | Remove | No 8099xx codes exist |

### Codes That Are Valid (confirmed against SBA document)
- All construction codes (2361, 2362, 2371, 2372, 2381, 2382) -- confirmed
- All healthcare codes (6211, 6212, 6216, 6219, 6221, 6231) -- confirmed
- All consulting codes (5411-5417) -- confirmed
- All education codes (6111-6116) -- confirmed
- All logistics codes (4811, 4841, 4851, 4911, 4921, 4931) -- confirmed
- All energy codes (2211, 2212, 2213, 3241, 3353) -- confirmed
- All admin codes (5611-5615) -- confirmed
- All social services codes (6241-6244) -- confirmed
- Finance codes (5221, 5231, 5241, 5251) -- confirmed
- Note: Public Administration codes (9221, 9241, 9281) are valid NAICS codes but the SBA does not set size standards for Sector 92. They are still useful for contract search filtering.

---

## File 2: `src/components/company/NaicsCodeSelector.tsx` (6-digit codes)

These are the specific codes users can select for their company profile.

### Issues Found

| Current Code | Current Description | Problem | Correct Code | Correct Description |
|-------------|-------------------|---------|-------------|-------------------|
| `511210` | Software Publishers | Old code from pre-2022 NAICS | `513210` | Software Publishers |
| `517311` | Wired Telecommunications Carriers | Old code from pre-2022 NAICS | `517111` | Wired Telecommunications Carriers |

### All Other Codes Validated as Correct
The remaining 33 codes in NaicsCodeSelector (236220, 238210, 334111, 334511, 336411, 423430, 518210, 519290, 541330, 541380, 541511-541519, 541611-541690, 541715, 541990, 561210, 561320, 561612, 561621, 561720, 562111, 611430, 621999, 811212, 928110) are all confirmed valid per the SBA document.

---

## Proposed Changes

### 1. Update `src/config/sectors.ts`

```text
SECTOR_NAICS changes:
  technology:    ["5415", "5182", "5132", "5192"]
                  (removed 5179, changed 5112->5132, changed 5191->5192)

  marketing:     ["5418", "5192", "7111", "7113"]
                  (changed 5191->5192)

  data_analytics: ["5415", "5182", "5192"]
                  (changed 5191->5192)

  telecom:       ["5171", "5172", "5174", "5178"]
                  (changed 5179->5178 for "All Other Telecom")

  scientific:    ["5417", "5414", "5419"]
                  (removed invalid 7132 and 8099, added 5414 for
                   Specialized Design Services and 5419 for Other
                   Professional/Scientific/Technical Services)
```

### 2. Update `src/components/company/NaicsCodeSelector.tsx`

```text
Change:  { code: "511210", desc: "Software Publishers" }
To:      { code: "513210", desc: "Software Publishers" }

Change:  { code: "517311", desc: "Wired Telecommunications Carriers" }
To:      { code: "517111", desc: "Wired Telecommunications Carriers" }
```

---

## Impact

- **Sector Browse page**: Sector cards will map to correct NAICS prefixes for filtering
- **Search Hub**: Industry-based search will use accurate NAICS prefix matching
- **Company Profile**: Users selecting NAICS codes will see current 2022-revision codes
- **No database migration needed** -- these are frontend-only configuration changes

