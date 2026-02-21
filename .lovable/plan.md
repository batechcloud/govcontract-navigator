# Contract Detail Page

## Overview

Add a dedicated in-app contract detail page so that clicking any contract title -- in Search results, My Opportunities (Kanban/List), Dashboard, or anywhere else -- opens a rich detail view within the app instead of redirecting to SAM.gov. The SAM.gov link will remain available as a secondary action on the detail page.

## What You'll Get

- A new `/dashboard/contract/:contractId` page with full contract details
- Clickable contract titles everywhere in the app (search results, Kanban cards, list view, dashboard)
- Contract detail page showing: title, agency, value, deadline countdown, set-aside type, document and attachment for that contract (if any), NAICS code, description, solicitation number, status, priority, notes, and a link to SAM.gov
- Action buttons on the detail page: Start Bid, Save/Track, Ask AI, Score This, View on SAM.gov
- For tracked contracts: editable notes, priority, and status directly on the detail page

## Pages and Components Affected

### New Files

1. `**src/pages/ContractDetail.tsx**` -- Full-page contract detail view with:
  - Contract header (title, agency, badges for type/set-aside)
  - Key metrics row (value, deadline with countdown, location, NAICS, solicitation number)
  - Full description section
  - Action buttons (Start Bid, Save, Ask AI, Score, View on SAM.gov)
  - For tracked contracts: inline notes editor, priority selector, status selector
  - Data source indicator

### Modified Files

2. `**src/App.tsx**` -- Add route: `/dashboard/contract/:contractId`
3. `**src/pages/SearchHub.tsx**` -- Make contract titles clickable links to `/dashboard/contract/:id`, passing result data via router state
4. `**src/components/tracked/KanbanCard.tsx**` -- Make title a clickable link to the detail page
5. `**src/components/tracked/ListView.tsx**` -- Make title a clickable link to the detail page
6. `**src/components/dashboard/OpportunityCard.tsx**` -- Make title a clickable link
7. `**src/pages/Dashboard.tsx**` -- Make deadline contract titles clickable if they appear

## Technical Details

### Data Flow

- **From Search results**: Contract data is passed via React Router's `state` prop (since search results aren't persisted in the database). The detail page reads `location.state` to display the contract.
- **From Tracked Contracts**: The page fetches the contract from the `tracked_contracts` table using the contract ID from the URL. This provides persisted notes, priority, and status.
- **Fallback**: If no state and no tracked contract found, show a "Contract not found" message with a link back to search.

### URL Structure

```text
/dashboard/contract/:contractId
```

Where `contractId` is the SAM.gov notice ID (e.g., `abc123def...`) or the tracked_contracts table `id`.

### Contract Detail Page Layout

```text
+------------------------------------------+
| < Back to Search / My Opportunities      |
+------------------------------------------+
| [Solicitation] [Full & Open] [SDVOSB]    |
|                                          |
| Contract Title (large heading)           |
| Agency Name                              |
+------------------------------------------+
| $4.2M  |  12 days left  |  VA  |  5415  |
+------------------------------------------+
| Description                              |
| (full text, not truncated)               |
+------------------------------------------+
| Solicitation #: W912AB-24-R-0001         |
| Posted: Jan 15, 2026                     |
| Source: SAM.gov                          |
+------------------------------------------+
| [Start Bid] [Save] [Ask AI] [Score]      |
|                    [View on SAM.gov ->]   |
+------------------------------------------+
| Notes & Tracking (if saved)              |
| Priority: [High/Med/Low]                 |
| Status: [Watching/Qualifying/...]        |
| Notes: [editable textarea]              |
| [Save Changes]                           |
+------------------------------------------+
```