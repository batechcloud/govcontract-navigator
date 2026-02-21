
# USASpending Intelligence Page

## Overview
Add a full-featured USASpending.gov data dashboard accessible at `/dashboard/usaspending`. This page pulls from the free USASpending.gov public API and presents federal spending data in 10 sections with charts, tables, search, and educational content.

## Files to Create

### 1. `src/pages/USASpendingIntel.tsx`
The main page component, wrapped in `DashboardLayout`. Contains all 10 sections as separate sub-components rendered vertically. Manages global state for:
- Selected fiscal year (FY2024 default)
- Last refreshed timestamp
- Refresh trigger (increment counter to re-fetch all queries)
- Selected agency filter (from Section 3 click-through to Section 5)

### 2. `src/hooks/useUSASpending.tsx`
Custom hook file containing multiple TanStack Query hooks for each API endpoint:
- `useSpendingSnapshot(fy)` -- KPI card data
- `useTopAgencies(fy)` -- spending explorer by agency
- `useSpendingByCategory(fy)` -- spending explorer by object class
- `useAwardSearch(filters)` -- award search with pagination
- `useTopRecipients(fy)` -- top recipients aggregation
- `useSpendingTrends()` -- multi-year trend data (FY2020-FY2024)
- `useGeographicSpending(fy)` -- spending by state
- `useSmallBusinessData(fy)` -- SB set-aside filtered awards

All hooks use `queryKey` arrays that include the fiscal year so changing the year auto-refetches.

### 3. `src/lib/usaspending-utils.ts`
Utility functions:
- `formatDollars(amount)` -- format as $1.2B, $450M, etc.
- `getFiscalYearDates(fy)` -- returns start_date/end_date strings
- `formatPercent(value)` -- one decimal place
- `abbreviateNumber(n)` -- K, M, B formatting

### 4. Section Components (inside `src/components/usaspending/`)
To keep the main page file manageable, each section will be its own component:

| File | Section |
|------|---------|
| `SpendingHeader.tsx` | Section 1 -- Title, year selector, refresh button |
| `SpendingSnapshot.tsx` | Section 2 -- 5 KPI cards row |
| `TopAgencies.tsx` | Section 3 -- Agency table + horizontal bar chart |
| `SpendingByCategory.tsx` | Section 4 -- Donut chart + category table |
| `AwardExplorer.tsx` | Section 5 -- Search controls + results table with pagination |
| `TopRecipients.tsx` | Section 6 -- Leaderboard table with expandable rows |
| `SpendingTrends.tsx` | Section 7 -- Multi-year area/line chart |
| `GeographicSpending.tsx` | Section 8 -- State table + card grid |
| `SmallBusinessIntel.tsx` | Section 9 -- 4 metric cards + breakdown table |
| `USASpendingGuide.tsx` | Section 10 -- Accordion with educational content |

## Files to Modify

### `src/App.tsx`
- Import `USASpendingIntel` page
- Add route: `/dashboard/usaspending` (protected, wrapped in ErrorBoundary)

### `src/components/dashboard/DashboardSidebar.tsx`
- Add `BarChart3` icon import from lucide-react
- Insert new sidebar item between "Browse Sectors" and "My Opportunities":
  ```
  { icon: BarChart3, label: "USASpending Intel", href: "/dashboard/usaspending" }
  ```

## Technical Details

### API Endpoints Used (all POST to `https://api.usaspending.gov/api/v2/...`)
All calls are made directly from the browser (no edge function needed) since USASpending.gov APIs are public with no authentication required.

| Endpoint | Used By |
|----------|---------|
| `search/spending_by_award/` | Sections 5, 6, 9 |
| `spending_explorer/` | Sections 3, 4 |
| `search/spending_by_geography/` | Section 8 |
| `references/total_budgetary_resources/` | Section 2 |

### Error Handling Strategy
Each section component independently:
- Shows skeleton loaders during fetch
- Catches errors and displays an inline error banner with a "Retry" button
- Never crashes the whole page if one API call fails

### Charting
All charts use the existing Recharts library:
- `BarChart` (horizontal) for top agencies
- `PieChart` (donut) for spending by category
- `AreaChart` with two lines for trends
- Consistent color scheme using CSS variables (primary blue, accent gold, success green)

### Styling
- Matches existing dark glassmorphic design system
- Cards use `bg-card border border-border` (existing pattern)
- Section headers use primary color accents
- Responsive: cards scroll horizontally on mobile, tables become scrollable, charts resize via `ResponsiveContainer`

### State Management
- Fiscal year selection and refresh state managed via `useState` in the parent page component and passed down as props
- Award search uses local state for filters + TanStack Query for results
- "Save" button in award explorer uses the existing `useContractStore` Zustand store

### Pagination
Award search results use offset-based pagination with `page` state, sending `limit: 25` and calculating offset. Previous/Next buttons control the page.

## Sequencing
1. Create utility file (`usaspending-utils.ts`)
2. Create hooks file (`useUSASpending.tsx`)
3. Create all 10 section components in parallel
4. Create the main page component (`USASpendingIntel.tsx`)
5. Update `App.tsx` with route
6. Update `DashboardSidebar.tsx` with nav item
