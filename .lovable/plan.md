

## Plan: Make Quick Filter Buttons Work as Toggleable Filters for Both Tabs

The quick filter buttons (Small Business, Veteran-Owned, Woman-Owned, Minority-Owned, HUBZone, Federal) already toggle on/off and trigger searches for **Prime Contracts**. However, they do **not** trigger or pass filters when the **Subcontracts** tab is active. Here's what needs to change:

### Changes in `src/pages/SearchHub.tsx`

1. **Update `handleQuickFilter`** — When `activeTab === "subcontracts"`, toggling a quick filter should trigger a subaward search. Since the USASpending subawards API doesn't support set-aside filtering server-side, apply client-side filtering on results by matching the set-aside/business type keywords against the subaward description or prime contractor fields.

2. **Update `handleSearch`** — When searching subcontracts with active quick filters, pass the filter labels as additional keywords to the subaward search (e.g., appending "small business" or "veteran" to the keyword), and/or apply client-side post-filtering on results.

3. **Client-side filter on subaward results** — After fetching subaward results, filter them based on active quick filters by checking description text for relevant terms (e.g., "small business", "woman-owned", "veteran", "HUBZone", "8(a)"). Store the mapping of filter labels to search terms.

### Implementation Details

- Add a mapping from quick filter labels to subaward keyword terms:
  - "Small Business" → searches for "small business"
  - "Veteran-Owned" → "veteran"
  - "Woman-Owned" → "woman"
  - "Minority-Owned" → "minority" or "8(a)"
  - "HUBZone" → "hubzone"
  - "Federal" → no additional filter (all subawards are federal)

- In `handleQuickFilter`, add a branch: if `activeTab === "subcontracts"`, call `subawardSearch.mutateAsync` with the combined keyword (search query + filter terms) and update results.

- Ensure toggling filters off re-runs the search without those terms.

- Keep the existing visual toggle behavior (active/inactive styling with X icon) unchanged.

