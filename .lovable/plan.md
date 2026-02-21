

# Upgrade NAICS Dropdown in SearchHub Advanced Filters

## Problem
The SearchHub Advanced Filters page (`/dashboard/search`) uses a hardcoded list of only **10 NAICS codes** in a basic Select dropdown, while the Company Profile page already has a full searchable selector with **1,057 codes** across 20 sectors. These need to be consistent.

## Changes

### 1. Replace the Select dropdown with the `NaicsCodeSelector` component in SearchHub
- **File**: `src/pages/SearchHub.tsx`
- Remove the hardcoded `naicsOptions` array (lines 117-128)
- Import `NaicsCodeSelector` from `@/components/company/NaicsCodeSelector`
- Replace the NAICS `<Select>` dropdown (lines 662-676) with the `NaicsCodeSelector` component
- Update state from `advNaics` (single string) to an array to match the component's interface
- Update `buildCombinedFilters` and `handleApplyAdvancedFilters` to work with the array format
- Update `hasAdvancedFilters` check to use array length instead of truthy string
- Update `clearAdvancedFilters` to reset to empty array

### 2. Verify Company Profile NaicsCodeSelector
- No changes needed -- the Company Profile already uses the updated `NaicsCodeSelector` with the wider 480px dropdown, scrollbar styling, and bottom fade gradient indicator. These were applied in the previous edit.

## Technical Details

```text
Modified file:
  src/pages/SearchHub.tsx
    - Import NaicsCodeSelector component
    - Change advNaics state from string to string[]
    - Replace Select with NaicsCodeSelector in Advanced Filters panel
    - Update filter building logic to pass array directly
    - Remove hardcoded naicsOptions array
```

## Impact
- Users on the Search Hub will now have access to all 1,057 NAICS codes with searchable, categorized dropdown -- identical to the Company Profile experience
- The wider dropdown, custom scrollbar, and fade indicator will automatically apply since they are built into the shared component

