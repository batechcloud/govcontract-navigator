

## Plan: Make Subcontract Cards Clickable + Full Feature Parity

### Problem
1. Subcontract card titles are plain text (not clickable links), unlike prime contracts which link to `/dashboard/contract/:id`
2. Subcontract cards have Save and overflow menu but lack the same visual layout as prime cards (inline Save button + Ask AI actions)

### Changes — `src/pages/SearchHub.tsx`

**1. Make subcontract titles clickable** — Wrap the `<h3>` title in a `<Link>` to `/dashboard/contract/:id`, passing subaward data mapped to `ContractData` format via `location.state.contractData`:
```tsx
<Link
  to={`/dashboard/contract/${sub.subaward_number || sub.id}`}
  state={{ contractData: {
    id: sub.subaward_number || sub.id,
    title: sub.description || `Subaward #${sub.subaward_number}`,
    agency: sub.prime_recipient || "Unknown",
    value: sub.amount ? `$${sub.amount.toLocaleString()}` : undefined,
    postedDate: sub.action_date,
    location: sub.place_of_performance,
    description: sub.description,
    link: sub.prime_award_id ? `https://www.usaspending.gov/award/${sub.prime_award_id}` : undefined,
  }}}
  className="hover:text-primary hover:underline transition-colors"
>
```

**2. Restructure subcontract card actions to match prime cards** — Replace the current top-right icon-only layout with the same inline button row used by prime cards:
- Inline **Save** button (with Heart icon, same style as prime)
- **Ask AI** button (visible, not hidden in overflow)  
- Overflow menu with: View on USASpending, Research Prime Contractor

**3. Add "Saved" badge** — Show the same green "Saved" badge on subcontract cards when tracked, matching prime card behavior.

### Files to Modify
- `src/pages/SearchHub.tsx` — Lines ~892-1008 (subcontract card rendering)

### No Changes Needed
- `ContractDetail.tsx` — Already handles data from `location.state.contractData`, works for any contract shape
- No new routes, hooks, or edge functions needed

