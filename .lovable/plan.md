

# UX Simplification Review for GC Navigator

After reviewing the full application, here are the key areas where the experience can be made simpler and more intuitive for someone with zero government contracting knowledge.

---

## Issues Found

### 1. Search Page is Overwhelming (SearchHub.tsx — 1,628 lines)
- **Two search buttons** side by side ("Search Cache" and "Sync from API") — confusing. Users don't know or care about caches vs APIs.
- **Technical labels**: "Search Cache", "Sync from API", "cached contracts", "total in cache" — these are developer concepts, not user concepts.
- **Too many visible actions per card**: Save, Start Bid, Refresh, Score, plus a `...` overflow menu = 5 action buttons per contract card. Overwhelming.
- **"Refresh" button on every card** with "Updated 3 hours ago" — users don't need to manually refresh individual contracts.
- **Rate limit bar** and "X/Y searches left today" shown prominently — adds anxiety.
- **Prime Contracts / Subcontracts tabs** use jargon. Most beginners don't know the difference.

### 2. Sidebar Has Too Many Items (8 items)
- "Browse Sectors" and "USASpending Intel" are power-user features that add cognitive load. They could be tucked under the search page or removed from primary nav.

### 3. Contract Cards Show Too Much Technical Data
- Heuristic scores, match badges, NAICS codes, set-aside badges, and "Updated X ago" timestamps create visual noise.
- The score number (e.g., "72") has no context without hovering the tooltip.

### 4. More Filters Sheet Has Jargon
- "NAICS Code", "PSC Code", "Set-Aside Type", "FFP", "IDIQ", "BPA", "T&M", "Cost-Plus" — all jargon that a beginner won't understand.

---

## Proposed Simplification Plan

### A. Simplify Search Page UX
1. **Merge "Search Cache" and "Sync from API" into one "Search" button.** Behind the scenes: search cache first, and if cache is empty or stale (>24h), auto-sync from API. Remove the "Sync from API" button entirely.
2. **Replace technical status text**: Change "Showing 25 of 142 cached contracts (500 total in cache)" to just "Showing 25 of 142 results".
3. **Remove per-card "Refresh" button and "Updated X ago" timestamp.** Handle freshness automatically in the background.
4. **Reduce card actions to 2 visible buttons**: "Save" and "Learn More" (which goes to detail page). Move "Start Bid", "Score", and "Ask AI" to the detail page.
5. **Hide rate limit bar** — only show a warning toast when user is close to the limit (e.g., <5 remaining).

### B. Simplify Sidebar Navigation (8 → 5 items)
- Remove "Browse Sectors" from sidebar (make it a section on the search page or a filter).
- Remove "USASpending Intel" from sidebar (link it from search results or the AI assistant instead).
- Final sidebar: **Home, Find Contracts, My Opportunities, My Proposals, Ask AI, My Business** (6 items, matching the core sections in memory).

### C. Replace Jargon with Plain Language
- **"Set-Aside Type"** → "Who can bid?" with friendly labels: "Small Businesses Only", "Veteran-Owned", "Woman-Owned", "Minority-Owned", "HUBZone Area"
- **"Prime Contracts" tab** → "Direct Contracts" with subtitle "Bid directly with the government"
- **"Subcontracts" tab** → "Team-Up Opportunities" with subtitle "Work with a bigger company"
- **"NAICS Code"** → "Industry Code (optional)" — already partially done but still says "NAICS"
- **Contract types**: "FFP" → "Fixed Price", "IDIQ" → "Flexible Quantity", "BPA" → "Blanket Agreement", "T&M" → "Hourly + Materials", "Cost-Plus" → "Cost + Fee"
- **"ROI Score" / heuristic score** → "Fit Score" with a simple label like "Great Fit", "Good Fit", "Low Fit" instead of a number

### D. Simplify Contract Cards
- Show only: Title, Agency, Dollar Value, Days Left, and a colored "Fit" badge (Great/Good/Low)
- One primary action: "Save" (heart icon). Clicking the card title navigates to the detail page where all other actions live.

### E. Add Contextual Help
- Add a small "What's this?" tooltip icon next to Quick Filters explaining what each filter means in plain English.
- On the empty state, add a friendlier onboarding message: "Tell us what your business does and we'll find government contracts for you."

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SearchHub.tsx` | Merge search buttons, simplify card actions, rename tabs, replace jargon, hide technical indicators |
| `src/components/dashboard/DashboardSidebar.tsx` | Remove "Browse Sectors" and "USASpending Intel" from nav |
| `src/hooks/useCachedContracts.ts` | Add auto-sync logic when cache is empty/stale |
| `src/lib/heuristic-score.ts` | Rename score labels to "Great Fit" / "Good Fit" / "Low Fit" |

This is a significant refactor of SearchHub.tsx but the changes are mostly UI copy and removing/relocating elements rather than new logic.

