

## Add AI-Powered Contract Summary Section to Detail Page

### What It Does
Adds a prominent "Quick Summary" card near the top of every Contract Detail page that uses AI to generate a plain-English overview covering: what the contract is about, what's needed, requirements, who can bid, estimated value, timeline, and a bid/no-bid recommendation — all written so a beginner can understand it.

### Implementation

**1. New Edge Function: `ai-contract-summary`**
- Accepts the contract's title, agency, description, value, set-aside, NAICS, deadline, type, and location
- Sends to GPT-4o-mini with a prompt like: "You are explaining this government contract to someone who has never done government contracting. Write a clear summary covering: What they're buying, What's required, Who can bid, How much it's worth, Key dates, and Should a small business consider bidding? Use simple language, short sentences, and bullet points."
- Returns a structured markdown summary

**2. Update `src/pages/ContractDetail.tsx`**
- Add a "Quick Summary" card placed right after the header card (before the raw Description)
- On mount, auto-invoke `ai-contract-summary` with all available contract data
- Show a skeleton/loading state while generating
- Cache the result in component state so it doesn't re-fetch on re-renders
- Display the summary as formatted markdown using `react-markdown`
- Include a "Regenerate" button if the user wants a fresh summary

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/ai-contract-summary/index.ts` | Create — new edge function |
| `supabase/config.toml` | Add `[functions.ai-contract-summary]` with `verify_jwt = false` |
| `src/pages/ContractDetail.tsx` | Add summary card with auto-fetch on load |

### Summary Card UI
- Icon: `Sparkles` with "Quick Summary" heading
- Loading: skeleton lines with "Generating summary..." text
- Content: rendered markdown (bullet points, bold headers)
- Footer: small "Regenerate" button + "Powered by AI" label

