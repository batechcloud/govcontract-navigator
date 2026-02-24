

## Fix: AI Picks Click Navigation

### Problem
Clicking any recommendation in the "AI Picks For You" card navigates to `/dashboard/search?q=...`, which can cause errors. Real SAM.gov recommendations (Branch A) should navigate directly to the contract detail page, while AI-generated suggestions (Branch B) should navigate to a pre-filled search.

### Solution

**1. Update the AI Recommendations Card link logic** (`src/components/dashboard/AIRecommendationsCard.tsx`)

- For **real SAM.gov recommendations** (`source !== "ai_generated"`): Navigate to `/dashboard/contract/:contractId` and pass the full contract data via React Router's `state` prop, matching the format the ContractDetail page expects.
- For **AI-generated suggestions** (`source === "ai_generated"`): Keep the current behavior of linking to `/dashboard/search?q=...` since these are not real contracts. But also add a visual indicator (e.g., a small search icon) to make it clear that these will trigger a search.

**2. Pass contract data via router state**

The ContractDetail page already reads `location.state` to populate contract info. The card will pass the recommendation fields (`title`, `agency`, `value`, `deadline`, `setAside`, `naicsCode`, `link`, `matchScore`) as state when linking to a real contract.

### Technical Details

**File: `src/components/dashboard/AIRecommendationsCard.tsx`**

Update the link generation block (~lines 88-97):

```tsx
{recs.slice(0, 5).map((rec: AIRecommendation) => {
  // Real SAM.gov results go directly to the contract detail page
  // AI-generated picks go to search with the search_tip as query
  const isRealContract = !isAIGenerated && rec.id && !rec.id.startsWith("ai-pick-");
  const linkTo = isRealContract
    ? `/dashboard/contract/${rec.id}`
    : `/dashboard/search?q=${encodeURIComponent((rec as any).search_tip || rec.title)}`;

  const linkState = isRealContract
    ? {
        title: rec.title,
        agency: rec.agency,
        value: rec.value,
        deadline: rec.deadline,
        setAside: rec.setAside,
        naicsCode: rec.naicsCode,
        type: rec.type,
        link: rec.link,
      }
    : undefined;

  return (
    <Link
      key={rec.id}
      to={linkTo}
      state={linkState}
      ...
    >
```

This is a minimal, targeted change -- only the link destination and state passing are updated. No backend changes needed.

