

## Fix "Score This" Button on Contract Detail Page

**Problem**: The "Score This" button on `/dashboard/contract/:id` doesn't score. It navigates away to the Search page and shows a toast saying "Use the Score This button on search results." The scoring infrastructure (`useWinProbability` hook, `WinScoreModal`, `ai-contract-score` edge function) already exists and works on the Search Hub — it's just not wired up on the Contract Detail page.

### Changes

**`src/pages/ContractDetail.tsx`**

1. Import `useWinProbability`, `ContractScoreInput`, `ContractScoreResult` from the existing hook, and import the `WinScoreModal` component.

2. Add state and hook wiring:
   - `const winScore = useWinProbability();`
   - `const [scoreModalOpen, setScoreModalOpen] = useState(false);`
   - `const [scoreResult, setScoreResult] = useState<ContractScoreResult | null>(null);`

3. Replace the current "Score This" button handler (lines 469–478) — instead of navigating away, it will:
   - Build a `ContractScoreInput` from the current `contract` data (title, agency, value, setAside, naicsCode, deadline, type, description)
   - Open the `WinScoreModal` immediately (shows loading skeleton)
   - Call `winScore.mutateAsync(input)` and store the result in `scoreResult`

4. Render `<WinScoreModal>` at the bottom of the component, passing `scoreModalOpen`, `scoreResult`, `winScore.isPending`, and `contract.title`.

**No edge function changes needed** — `ai-contract-score` and `OPENAI_API_KEY` are already configured and working.

