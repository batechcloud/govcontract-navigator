

## Plan: Simplify the Find Contracts UI

The current page has too many visible controls at once — quick filter badges, a price dropdown, an advanced filters panel, separate subcontract filters, and dense result cards with 5+ action buttons each. The goal is to make it feel clean and approachable while keeping all functionality accessible.

### Key Design Changes

**1. Consolidate the search area**
- Keep the search bar and Search button as-is (already clean)
- Remove the "Search in Plain English" heading and sparkles — just show the search bar with a simple placeholder like "What does your business do?"
- Move the rate limit counter into a subtle tooltip on the search button instead of always-visible text

**2. Simplify quick filters into a single row of pill toggles**
- Keep the 6 quick filter badges but make them smaller, uniform pills
- Remove the separate Price Range dropdown from the quick filter row — move it into Advanced Filters only
- The quick filters row becomes: `[Small Business] [Veteran] [Woman-Owned] [Minority] [HUBZone] [Federal]` + `[More Filters]` button

**3. Replace the "Advanced Filters" collapsible with a slide-out sheet or a simple expandable section**
- Rename to "More Filters" — less intimidating
- When expanded, show filters in a cleaner 2-column layout with clear labels
- Combine PSC/NAICS into one section labeled "Industry Codes (optional)"
- Group: Contract Value | Agency | Type (row 1), Deadline | Location (row 2)
- Single "Search with Filters" button at bottom

**4. Move Subcontract filters into the same "More Filters" panel**
- Instead of a separate filter card that appears after switching tabs, add a "Subcontract Options" section inside the unified More Filters panel (only visible when Subcontracts tab is active)
- This eliminates the separate filter card that makes the UI feel layered

**5. Simplify result cards**
- Reduce action buttons from 5 to 2 visible + overflow menu
- Primary actions visible: **Save** and **Start Bid**
- Secondary actions (Ask AI, Score, View on SAM.gov) go into a "⋯" dropdown menu
- Remove redundant badges — show only the match score badge and set-aside (if applicable)
- Keep: title, agency, value, deadline, location

**6. Clean up the tabs**
- Keep Prime Contracts / Subcontracts tabs but style them as simple underlined tabs rather than the current glass-styled tab bar

### Files to Modify

- **`src/pages/SearchHub.tsx`** — All UI restructuring (search area, filters, result cards, tabs)
- No backend or hook changes needed — purely a UI simplification

### What Stays the Same
- All search functionality (keyword, quick filters, advanced filters, subcontract search)
- All data hooks and API calls
- Tracking, bidding, AI, scoring features (just moved to overflow menu)
- Save Search dialog, Win Score modal
- Batch loading, scroll-to-top FAB

