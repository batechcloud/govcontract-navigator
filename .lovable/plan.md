

# Simplify GovAI Search for Non-Tech-Savvy Users

## The Problem

The current app has **17+ dashboard pages** spread across a complex sidebar with jargon-heavy labels (NAICS codes, Kanban pipeline, Competitor Analysis, etc.). For a small business owner who just wants to find and win government contracts, this is overwhelming.

## Simplification Strategy

The core idea: **reduce the dashboard to 5 main sections** that follow a natural workflow any business owner can understand:

```text
Find Contracts --> Save Favorites --> Write Proposals --> Track Progress --> Get Help
```

---

## Phase 1: Simplify the Sidebar Navigation

**Current sidebar (12 items):** Dashboard, Search Hub, Tracked Contracts, Journey Hub, Proposals, Company Profile, AI Assistant, Analytics, Documents, Calendar, Teaming, Market Watch

**New sidebar (5 items + Settings):**

| Icon | Label | What it does | Combines |
|------|-------|-------------|----------|
| Search | Find Contracts | Search all federal + state contracts | Search Hub + Saved Searches |
| Heart | My Opportunities | Saved/tracked contracts with simple status | Tracked Contracts + Journey Hub |
| FileText | My Proposals | View and create proposals | Proposals + Proposal Generator + Documents |
| Sparkles | AI Helper | Chat assistant + contract explainer | AI Assistant + Market Watch + Competitor Analysis |
| User | My Business | Company profile (simplified) | Company Profile + Settings |

---

## Phase 2: Simplify the Dashboard (Home Page)

Replace the current stats-heavy dashboard with a friendly, action-oriented home screen:

1. **Welcome banner** with one big call-to-action: "Find Contracts"
2. **3 simple cards**: "New matches for you" count, "Upcoming deadlines" count, "Proposals in progress" count
3. **Recent activity feed** (plain language: "You saved 'IT Support Services' 2 hours ago")
4. **Quick start tips** for first-time users (if no data yet)

Remove: Pipeline Value stat, Pipeline Status widget, Match Score percentages

---

## Phase 3: Simplify the Search Page

Current issues:
- Technical jargon like "NAICS codes", "Set-aside", "SDVOSB", "8(a)", "HUBZone"
- Match score percentages that mean nothing to beginners

Changes:
- Rename to "Find Contracts"
- Replace jargon quick-filters with plain language: "Small Business Only", "Veteran-Owned", "Woman-Owned", "Minority-Owned"
- Add category tabs: "All", "Federal", "State & Local"
- Simplify result cards: remove match score percentage, show simple "Good Match" / "Great Match" badges
- Replace "Generate Proposal" button with "Start Bid" (friendlier language)
- Add helpful tooltip explanations for any remaining technical terms

---

## Phase 4: Simplify "My Opportunities" (was Tracked Contracts + Journey Hub)

Replace the Kanban board and status groups with a simple list view:

- **3 tabs**: "Saved" / "In Progress" / "Completed"
- Each card shows: contract name, agency, deadline (in plain "5 days left" format), and simple status dropdown
- Remove: match score numbers, dollar parsing, complex pipeline stages
- Add: color-coded deadline urgency (green = plenty of time, yellow = soon, red = urgent)

---

## Phase 5: Simplify Company Profile

Current: 4 separate cards with NAICS codes, CAGE codes, DUNS numbers, UEI -- very intimidating.

Changes:
- Lead with "Tell us about your business" friendly header
- Group into 2 sections: "Basic Info" (name, size, revenue) and "What You Do" (capabilities in plain text)
- Move technical fields (SAM UEI, CAGE code, DUNS) into a collapsible "Advanced / Government IDs" section
- Replace NAICS code input with a searchable dropdown that shows industry names (not just numbers)
- Simplify certifications to show only the most common 6 with plain-language descriptions

---

## Phase 6: Simplify AI Helper Page

- Rename from "AI Assistant" to "Ask GovAI"
- Add more beginner-friendly suggestion chips: "What contracts fit my business?", "Help me understand this contract", "How do I get started with government bidding?"
- Keep the chat interface (it's already simple)

---

## Phase 7: Update Mobile Bottom Navigation

Current: Home, Search, Pipeline, Proposals, Settings
New: Home, Find, Saved, Proposals, Help

---

## Phase 8: Consolidate Routes

Remove standalone routes for pages being merged:
- Remove `/dashboard/journey` (merged into My Opportunities)
- Remove `/dashboard/analytics` (moved to AI Helper insights)
- Remove `/dashboard/competitors`, `/dashboard/win-loss` (advanced features, remove for now)
- Remove `/dashboard/saved-searches` (merged into Find Contracts)
- Remove `/dashboard/calendar` (deadlines shown inline on My Opportunities)
- Remove `/dashboard/teaming` (advanced feature, remove for now)
- Remove `/dashboard/market` (insights moved to AI Helper)

Keep redirects from old routes to new ones to avoid broken links.

---

## Technical Changes Summary

| File | Change |
|------|--------|
| `DashboardSidebar.tsx` | Reduce to 5 main nav items with friendly labels |
| `DashboardLayout.tsx` | Update mobile bottom nav to match new structure |
| `Dashboard.tsx` | Redesign to simple, action-oriented home screen |
| `SearchHub.tsx` | Rename labels, simplify filters, remove jargon |
| `TrackedContracts.tsx` | Redesign with 3 simple tabs, merge Journey Hub concept |
| `CompanyProfile.tsx` | Simplify layout, hide technical fields in collapsible section |
| `AIAssistant.tsx` | Update title and suggestions to be more beginner-friendly |
| `Proposals.tsx` | Minor label updates for friendlier language |
| `App.tsx` | Remove unused routes, add redirects |
| `Settings.tsx` | Keep as-is (already simple enough) |

