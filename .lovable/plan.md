

## Plan: Make Subcontract Cards Visually Match Prime Contract Cards

The subcontract cards already have clickable titles, Save, Ask AI, and overflow menu. The remaining issue is **visual inconsistency** with prime contract cards.

### Changes — `src/pages/SearchHub.tsx`

**1. Match Save button style** — Change from `variant="ghost"` to `variant="outline"` with same `h-8 text-xs` sizing, matching prime card Save button (line 760-771).

**2. Match Ask AI button style** — Change from `variant="ghost"` to `variant="outline"` with `h-8 text-xs`, making it visually equivalent to the prime card's "Start Bid" level of prominence (but keep outline since it's not a primary action like Start Bid).

**3. Remove border-t separator** — Prime cards don't have `border-t border-border/50 mt-1` on the action row. Remove it from subcontract cards for consistency.

**4. Match overflow menu button** — Change from `variant="ghost" size="icon"` to `variant="ghost" size="sm" className="h-8 w-8 p-0"` to match prime card's overflow trigger.

**5. Add dropdown styling** — Add `className="bg-card border-border"` to `DropdownMenuContent` and `className="gap-2 cursor-pointer"` to each `DropdownMenuItem`, matching prime card overflow menu styling.

### Single file change
- **`src/pages/SearchHub.tsx`** — Lines 948-1017 (subcontract action row)

