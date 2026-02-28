

## Plan: Add Feature Parity to Subcontract Cards

### Current State
- Prime contract cards have: Save, Start Bid, overflow menu (Ask AI, Score, View on SAM.gov)
- Subcontract cards only have: "View on USASpending" button
- Subcontracts come from USASpending (historical awards), not SAM.gov (active solicitations)

### What to Add to Subcontract Cards

**1. Save button** — Allow tracking subcontracts in the pipeline. Adapt `handleTrack` to accept subcontract data by mapping SubawardResult fields to the tracked_contracts format (use subaward_number as contract_id, prime_recipient as agency, etc.).

**2. Ask AI button** — Reuse the same AI chat flow. Pre-fill a question like: "Tell me about this subcontract from [prime_recipient] to [subawardee] worth $[amount] for: [description]. How can I position my company for similar subcontracting opportunities?"

**3. Overflow menu** — Include Ask AI, View on USASpending (moved from standalone button), and a new "Research Prime Contractor" option that searches for the prime recipient.

**4. Remove "Start Bid"** — Subcontracts are historical awards, not open solicitations, so "Start Bid" doesn't apply.

**5. No attachment summarization** — USASpending subaward data doesn't include document attachments, so this feature genuinely does not apply. The detail page link would also not work since subcontracts don't have SAM.gov noticeIds.

### Files to Modify
- **`src/pages/SearchHub.tsx`** — Update the subcontract card rendering (lines ~884-946) to add Save button, overflow menu with Ask AI and View on USASpending

### What Won't Change
- No new edge functions or hooks needed
- The existing `handleTrack` and `handleAskAI` patterns are reused with adapted data
- No database changes — tracked_contracts table already supports flexible contract data

