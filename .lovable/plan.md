

# Redesign: My Opportunities Page

## Overview
Replace the current tab-based list view with a Kanban-style board featuring drag-and-drop, an inline status dropdown, a search/filter bar, and a pipeline analytics section with recommendations.

## New Layout

```text
+---------------------------------------------------------------+
|  My Opportunities                    [Search...] [Filter] [Export CSV] |
+---------------------------------------------------------------+
|  PIPELINE ANALYTICS                                           |
|  [Total: 12] [Won: 3 / $2.1M] [Win Rate: 42%] [Avg Days: 18]|
|  [Progress Bar: Saved -> Won funnel]                          |
|  [Recommendations: "3 contracts expiring soon", etc.]         |
+---------------------------------------------------------------+
|  VIEW: [Board] [List]                                         |
+---------------------------------------------------------------+
|  BOARD VIEW (default - drag & drop between columns):          |
|  | Saved | Qualifying | Writing | Submitted | Won | Lost |   |
|  | card  | card       |         | card      |     |      |   |
|  | card  |            |         |           |     |      |   |
+---------------------------------------------------------------+
|  LIST VIEW (table with status dropdown per row):              |
|  Title | Agency | Deadline | Value | Status [dropdown] | Del  |
+---------------------------------------------------------------+
```

## Status Pipeline (6 stages)
1. **Saved** (watching) -- initial save
2. **Qualifying** -- evaluating fit
3. **Writing Proposal** (proposal) -- actively writing
4. **Submitted** -- bid sent
5. **Won** -- contract awarded
6. **Lost** -- not selected

## Features

### 1. Pipeline Analytics Section
- **Stats cards**: Total opportunities, total value, win rate (won / (won+lost)), avg days in pipeline
- **Funnel visualization**: horizontal progress bar showing count at each stage
- **Recommendations**: auto-generated tips like "3 contracts expire within 7 days", "Move 2 qualifying contracts forward or archive", "Your win rate is above average -- keep it up"

### 2. Dual View: Board + List
- Toggle between Kanban board and compact list view
- Preference saved in localStorage

### 3. Kanban Board (Board View)
- 6 columns, one per status
- Cards show: title, agency, deadline countdown, value, priority badge
- **Drag and drop** using `@hello-pangea/dnd` (already installed) to move cards between columns
- On drop, call `useUpdateContractStatus` to persist to Supabase

### 4. List View
- Table rows with a status dropdown (same as current) for quick status changes
- Sortable by deadline, value, or date added
- Delete button per row

### 5. Search & Filter Bar
- Search by title/agency keyword
- Filter by priority (high/medium/low)
- Export to CSV button

## Technical Details

### Files to Create
- `src/components/tracked/PipelineAnalytics.tsx` -- stats cards, funnel bar, recommendations
- `src/components/tracked/KanbanBoard.tsx` -- drag-and-drop board using `@hello-pangea/dnd`
- `src/components/tracked/KanbanCard.tsx` -- individual draggable card
- `src/components/tracked/ListView.tsx` -- table/list view with status dropdowns
- `src/components/tracked/OpportunityFilters.tsx` -- search input + priority filter + export

### Files to Modify
- `src/pages/TrackedContracts.tsx` -- complete rewrite to compose the new sub-components, manage view toggle state, and wire up search/filter logic

### Hooks Used (existing, no changes needed)
- `useTrackedContracts` -- fetch all tracked contracts
- `useUpdateContractStatus` -- persist status changes on drag-drop or dropdown select
- `useUntrackContract` -- delete

### Drag-and-Drop Implementation
- Uses `@hello-pangea/dnd` (already a dependency)
- `DragDropContext` wraps the board; each column is a `Droppable`; each card is a `Draggable`
- `onDragEnd` maps the destination droppableId to a status value and calls `updateStatus.mutate()`

### Analytics Calculations (computed from `contracts` array)
- **Win Rate**: `won.length / (won.length + lost.length) * 100` (or "N/A" if none completed)
- **Total Value**: sum of parsed `contract_value` fields
- **Expiring Soon**: contracts with deadline within 7 days
- **Recommendations**: rule-based tips derived from the data (e.g., stale qualifying items, upcoming deadlines, win rate feedback)

### Responsive Behavior
- Desktop: full 6-column Kanban with horizontal scroll if needed
- Tablet: 3 columns visible with horizontal scroll
- Mobile: auto-switch to List view; Board view scrolls horizontally

