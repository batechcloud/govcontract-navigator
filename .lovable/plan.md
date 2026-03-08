

## Fix: Contract Detail Page — Support New Tab / Direct URL Access

### Problem
When right-clicking a contract link and opening in a new tab, the page shows "Contract not found" because:
1. `location.state` (React Router state) does not survive across tabs — it's memory-only
2. If the contract isn't in the user's `tracked_contracts`, there's no fallback data source
3. The page has no mechanism to fetch contract data directly from SAM.gov using the URL's `contractId` param

### Solution
Add a direct-fetch fallback in `ContractDetail.tsx`: when both `stateData` and `tracked` are null, call the existing `sam-refresh-single` edge function to load the contract by its `noticeId`. Also check `cached_contracts` table first as a faster lookup.

### Changes

**File: `src/pages/ContractDetail.tsx`**

1. Add a new state: `fetchedContract` (for data fetched via API) and `fetchLoading`
2. Add a `useEffect` that triggers when `stateData` is null and `tracked` is null:
   - First, check `cached_contracts` table for a match on `contract_id`
   - If not cached, call `sam-refresh-single` with the `contractId` param
   - Store the result in `fetchedContract` state
3. Update the `contract` derivation to include `fetchedContract` as a third fallback:
   ```
   const contract = stateData ? ... : tracked ? trackedToContractData(tracked) : fetchedContract;
   ```
4. Replace the immediate "not found" render with a loading state while `fetchLoading` is true — show a skeleton/spinner instead of the error card
5. Only show "Contract not found" after the fetch completes with no results

### What This Fixes
- Opening contract links in new tabs works seamlessly
- Sharing contract URLs with colleagues works (as long as they're authenticated)
- Browser back/forward navigation works correctly
- Session persistence is already handled by Supabase's `persistSession: true` + `autoRefreshToken: true` in the client config — no changes needed there

