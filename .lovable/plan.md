

# Search Hub Redesign — Simple, Pretty, 5th-Grader Friendly

## What We're Changing

The current search section (search bar, quick filters, more filters sheet, tabs, sort) will be redesigned into a cleaner, more visual layout that any beginner can navigate instantly.

## Design Overview

```text
┌─────────────────────────────────────────────────────────┐
│  🔍 [What does your business do? ............] [Search] │
│     [⏱ Saved Searches]  [💾 Save This Search]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── Filter By ──────────────────────────────────────    │
│                                                         │
│  Status:   [🟢 Active Only] [⏰ Expiring Soon]         │
│                                                         │
│  Due Date: [7 days] [14 days] [30 days] [60 days] [90] │
│                                                         │
│  Who Can Bid:                                           │
│  [Small Biz] [Veteran] [Woman-Owned] [Minority] [Hub]  │
│                                                         │
│  Budget:                                                │
│  [Under $25K] [$25K-100K] [$100K-500K] [...] [Over $25M│
│                                                         │
│  [⚙ More Options]  [↺ Clear All Filters]               │
├─────────────────────────────────────────────────────────┤
│  Direct Contracts  |  Team-Up Opportunities             │
│  Showing 25 of 10,000 results     [Sort: Match Score ▾]│
└─────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Inline Filter Section (replaces Quick Filters row)
Instead of a single row of pills + hidden "More Filters" sheet, show the most-used filters **inline** in a clean card below the search bar, organized by category:

- **Status row**: "Active Only" toggle pill (filters to active contracts), "Expiring Soon" pill (due within 14 days)
- **Due Date row**: Pill chips for 7 / 14 / 30 / 60 / 90 days — single-select, click to toggle
- **Who Can Bid row**: Keep existing quick filter pills (Small Business, Veteran, Woman-Owned, Minority, HUBZone) but with icons and tooltips
- **Budget row**: Clickable pill chips for value ranges (Under $25K, $25K-100K, etc.) — single-select

Each row has a simple label with a small help icon tooltip explaining what it means.

### 2. Collapsible "More Options" Section
The remaining advanced filters (Agency, Location/State, Opportunity Type, Payment Type, NAICS/PSC codes) move into a collapsible section at the bottom of the filter card — visible when "More Options" is clicked. This replaces the slide-out Sheet.

### 3. Visual Polish
- Filter card uses glassmorphic styling (`variant="glass"`) with subtle section dividers
- Active pills glow with the accent color and show a checkmark icon
- Each filter category row uses a simple icon + label (e.g., 📅 Due Date, 💰 Budget)
- "Clear All Filters" button appears only when filters are active, with a count badge
- Smooth expand/collapse animation for "More Options"

### 4. "Active Only" Filter
Add a new filter that checks `response_deadline > now()` to only show contracts that haven't expired. This is the most requested quick action.

## Files Modified

### `src/pages/SearchHub.tsx`
- Replace the Quick Filters row (lines 769-858) and the More Filters Sheet (lines 1357-1604) with a new inline `FilterSection` component
- Add `advActiveOnly` and `advExpiringSoon` state variables
- Update `buildCombinedFilters()` to include active-only and expiring-soon logic
- Add budget pill selection state (single-select value range)
- Move "More Options" (Agency, State, Opportunity Type, Payment Type, NAICS/PSC) into a collapsible `<Collapsible>` within the filter card
- Remove the `<Sheet>` for filters entirely

### `src/components/search/FilterSection.tsx` (new file)
- Extracted component for the inline filter card
- Props: all filter states + setters, onApply callback, active filter count
- Sections: Status, Due Date, Who Can Bid, Budget, collapsible More Options
- Each pill is a styled button with icon, tooltip, and active state
- Responsive: stacks vertically on mobile, wraps on tablet/desktop

### `src/hooks/useCachedContracts.ts`
- Update the `searchLocal` query builder to support `active_only: boolean` and `expiring_soon: boolean` filter params (adds `response_deadline > now()` and `response_deadline < now() + 14 days` WHERE clauses)

## Technical Notes
- The "Active Only" filter adds a `.gt('response_deadline', new Date().toISOString())` to the Supabase query
- "Expiring Soon" adds `.gt('response_deadline', now).lt('response_deadline', now + 14 days)`
- Budget pills map to the existing `valueRanges` array and set `advMinValue`/`advMaxValue`
- Filters auto-apply on click (no separate "Apply" button needed for inline filters) — triggers `cachedSearch.searchLocal()` immediately
- The collapsible "More Options" section still has an "Apply" button since those filters are more complex

