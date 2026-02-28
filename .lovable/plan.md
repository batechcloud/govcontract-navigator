

## Fix: React ref warning on DropdownMenu in SearchHub

**Problem**: Radix UI v2.1.15 `DropdownMenuTrigger` with `asChild` passes a ref callback to its child. React 18 logs a warning when a function component receives a ref via the legacy string/callback pattern through `asChild` composition. The shadcn `Button` does use `forwardRef`, but the warning can still appear due to Radix internally using `Slot` which merges refs.

**Root Cause**: This is a known Radix UI + React 18 ref warning. The typical fix is to wrap the trigger content in a plain `<button>` or ensure the `DropdownMenuTrigger` doesn't use `asChild` when unnecessary, or suppress it by removing `asChild` and styling the trigger directly.

**Fix** (in `src/pages/SearchHub.tsx`):

Remove `asChild` from both `DropdownMenuTrigger` instances (~lines 909 and 1119) and apply the button styling directly to the trigger:

**Before** (2 locations):
```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <MoreHorizontal className="w-4 h-4" />
  </Button>
</DropdownMenuTrigger>
```

**After** (2 locations):
```tsx
<DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
  <MoreHorizontal className="w-4 h-4" />
</DropdownMenuTrigger>
```

This eliminates the `asChild` + `Slot` ref-merging path that triggers the React warning, while maintaining identical visual appearance. Two edits total, both in `SearchHub.tsx`.

