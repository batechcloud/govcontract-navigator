

## Add Set-Aside Filter to Advanced Filters Panel

Currently, set-aside filtering is only available via the quick filter buttons. This adds a formal Set-Aside dropdown inside the "More Filters" sheet so users can also select set-aside types from there.

### Changes

**`src/pages/SearchHub.tsx`**

1. **Add state for advanced set-aside** — New state `advSetAside` (string array) alongside existing advanced filter states (around line 139). Include it in `hasAdvancedFilters` check and `clearAdvancedFilters`.

2. **Merge advanced set-aside with quick filter set-asides** — In `buildCombinedFilters()` and `handleQuickFilter()`, combine `advSetAside` values with the quick filter set-aside values (deduplicating) before passing to the API.

3. **Add Set-Aside multi-select UI in the More Filters sheet** — Insert a new filter section between "Contract Value" and "Agency" (around line 1141) with checkboxes for: Small Business, 8(a), WOSB, EDWOSB, HUBZone, SDVOSB, VOSB, SDB. Each checkbox toggles the code in `advSetAside`.

4. **Sync quick filters with advanced set-aside** — When a set-aside is selected in the advanced panel, also activate the corresponding quick filter button (and vice versa) to keep them consistent. Alternatively, keep them independent and merge at query time for simplicity.

### Set-Aside Options List
```text
Small Business, 8(a), WOSB, EDWOSB, HUBZone, SDVOSB, VOSB, SDB
```

### Technical Detail
- Use the `Checkbox` component from `@/components/ui/checkbox` for multi-select
- The `set_aside` array in filters will be the union of quick filter selections and advanced panel selections
- No edge function changes needed — the mappings already handle all these codes

