

# Expand PSC Code Database to Full GSA Manual (2,500+ Codes)

## Overview
The current PSC selector contains only 60 hand-picked codes as a flat list. The official GSA PSC Manual (April 2024) defines 2,500+ active codes organized into 4 major sections and dozens of categories. This upgrade will mirror the architecture used for the NAICS code expansion: a dedicated data file with grouped categories, imported by a shared component used in both the Company Profile and Search Hub Advanced Filters.

## Current State vs. Target

| Metric | Current | Target |
|--------|---------|--------|
| Total PSC codes | 60 | ~2,500+ |
| Categories | 12 (informal comments) | 40+ official categories |
| Data structure | Flat array in component | Grouped by category in data file |
| Sections covered | Partial D, R, J, S, U, V, W, Y, Z, some products | All 4 sections: R&D (A), IT (D), Services (B-Z), Products (numeric) |

## PSC Manual Structure (4 Sections)

**Section A -- Research and Development (R&D) Codes (~155 codes)**
- AA: Agriculture R&D
- AB: Community and Regional Development R&D
- AC: National Defense R&D
- AF: Education, Training, Employment R&D
- AG: Energy R&D
- AH: Natural Resources and Environment R&D
- AJ: General Science and Technology R&D
- AK: Commerce and Housing Credit R&D
- AL: Income Security R&D
- AM: International Affairs R&D
- AN: Health R&D
- AR: Space R&D
- AS: Transportation R&D

Each major area has sub-areas, each with 5 stages (Basic Research, Applied Research, Experimental Development, Admin Expenses, Facilities/Equipment).

**Section B -- IT Service Codes (~40 codes)**
- DA: Application
- DB: IT Security
- DC: Data Center
- DD: Delivery
- DE: End User
- DF: IT Management
- DG: Network
- DH: Platform
- DJ: Compute
- DK: Analytics/Statistics

**Section C -- General Service Codes (~1,500+ codes)**
- B: Special Studies/Analysis
- C: Architect and Engineering Services
- E: Purchase of Structures/Facilities
- F: Natural Resources Management
- G: Social Services
- H: Quality Control, Testing, and Inspection (largest -- H1xx, H2xx, H3xx, H9xx sub-categories)
- J: Maintenance, Repair, and Rebuilding of Equipment
- K: Modification of Equipment
- L: Technical Representative
- M: Operation of Structures/Facilities
- N: Installation of Equipment
- P: Salvage
- Q: Medical Services
- R: Professional/Administrative/Management Support
- S: Utilities and Housekeeping
- T: Photo/Map/Print/Publication
- U: Education/Training
- V: Transportation/Travel/Relocation
- W: Lease/Rental of Equipment (legacy codes)
- X: Lease/Rental of Structures/Facilities
- Y: Construction of Structures/Facilities
- Z: Maintenance, Repair, Alteration of Structures/Facilities

**Section D -- Product Codes (~800+ codes)**
- Numeric 4-digit codes organized by Federal Supply Class (FSC)
- Examples: 10xx Weapons, 15xx Aircraft, 58xx Communication Equipment, 65xx Medical, 70xx IT Equipment, 75xx Office Supplies, 89xx Food

## Changes

### 1. Create `src/data/pscCodes.ts` -- New File
A comprehensive data file containing all active PSC codes from the April 2024 manual, organized into groups matching the official category structure.

```text
Export: PSC_GROUPS: Array<{ label: string; codes: Array<{ code: string; desc: string }> }>
Export: ALL_PSC: flattened array of all codes
~2,500+ PSC codes across 40+ category groups
```

The groups will use clear labels like:
- "Section A: Agriculture R&D (AA)"
- "Section B: IT -- Application (DA)"
- "Section C: Special Studies/Analysis (B5)"
- "Section C: Architect & Engineering (C1/C2)"
- "Section C: Quality Control (H1)"
- "Section D: Weapons (10xx)"
- etc.

End-dated codes (Q506, Q512, Q526, and the 721 legacy R&D codes from V1.5) will be excluded.

### 2. Update `src/components/company/PscCodeSelector.tsx`
- Remove the inline `PSC_CODES` constant (60 codes)
- Import `PSC_GROUPS` and `ALL_PSC` from `@/data/pscCodes`
- Switch from a flat `CommandGroup` to grouped `CommandGroup` per category (same pattern as NAICS selector)
- Increase `PopoverContent` width to `480px` (matching NAICS)
- Increase `CommandList` max-height to `400px`
- Add scrollbar styling and bottom fade gradient indicator
- Use `ALL_PSC` for the `getLabel` lookup function

### 3. No changes needed to SearchHub
The Search Hub already imports and uses `PscCodeSelector` as a shared component. It will automatically receive the expanded code list.

## Technical Details

```text
New file:
  src/data/pscCodes.ts
    - Exports PSC_GROUPS: grouped array with ~40+ categories
    - Exports ALL_PSC: flat array of all ~2,500+ codes
    - Data extracted from GSA PSC Manual FY2024 (April 2024)

Modified file:
  src/components/company/PscCodeSelector.tsx
    - Remove inline PSC_CODES constant
    - Import { PSC_GROUPS, ALL_PSC } from "@/data/pscCodes"
    - Render grouped CommandGroups with category headers
    - Widen dropdown to 480px, increase max-height to 400px
    - Add scrollbar styling and gradient fade indicator
    - Update getLabel to use ALL_PSC for lookups
```

## Performance Considerations
- The `cmdk` Command component handles large datasets efficiently with client-side filtering
- Grouping into ~40+ categories helps users navigate without scrolling through 2,500 items
- The dataset is ~200KB which loads instantly as part of the JS bundle
- Same proven approach as the NAICS expansion (1,057 codes working well)

## Impact
- Both the Company Profile (/dashboard/company) PSC selector and the Search Hub (/dashboard/search) Advanced Filters PSC selector will show the complete GSA code set
- Users can search across all 2,500+ codes by code or description
- Codes are organized by official GSA categories for easy browsing

