

# AI Enhancement Plan (Using OpenAI)

## Overview
Build three new AI-powered features and upgrade the Dashboard -- all using **OpenAI GPT-4o-mini** via your existing `OPENAI_API_KEY` (already configured). The chat assistant will also be migrated from the Lovable AI Gateway to OpenAI for consistency.

---

## What You'll Get

### 1. Win Probability Score ("Score This Contract")
- Click **"Score This"** on any contract card in Search Hub or inside the Notes Modal
- AI analyzes the contract against your company profile (NAICS, certifications, capabilities, past performance)
- Returns a **0-100 win probability**, a **Bid / No-Bid recommendation**, and a list of strengths and gaps
- Displayed in a modal with a visual score ring

### 2. AI-Recommended Contracts on Dashboard
- A new **"AI Picks For You"** card on the Dashboard homepage
- Fetches your NAICS codes, certifications, and preferences, then queries recent SAM.gov opportunities
- AI ranks the top 5 best-fit contracts with a one-liner explaining why each is a match
- Each card is clickable -- takes you to Search Hub with that contract highlighted
- Results cached for 30 minutes to avoid repeated API calls

### 3. Profile Optimizer
- A **"Profile Health"** card on the Dashboard
- AI analyzes your company profile completeness and returns:
  - A score (0-100)
  - Top 3 actionable suggestions (e.g., "Add HUBZone certification", "Fill in past performance")
- Links to Company Profile page to make improvements

### 4. Migrate Chat Assistant to OpenAI
- Switch `ai-opportunity-chat` from the Lovable AI Gateway to OpenAI GPT-4o-mini
- Keeps streaming, same system prompt, same company context -- just a provider swap
- Consistent error handling (429 rate limits, 402 removed since OpenAI uses different billing)

---

## Technical Details

### New Edge Functions (all use `OPENAI_API_KEY` + `gpt-4o-mini`)

| Function | Purpose | Output Method |
|---|---|---|
| `ai-contract-score` | Win probability for a single contract | Tool calling (structured JSON) |
| `ai-recommend-contracts` | Top 5 personalized recommendations | Tool calling (structured JSON) |
| `ai-profile-optimizer` | Profile completeness + suggestions | Tool calling (structured JSON) |

All three functions will:
- Verify JWT in code (verify_jwt = false in config.toml)
- Fetch the user's company profile server-side from Supabase
- Call OpenAI with tool calling for structured output
- Handle 429 (rate limit) errors with retry + user-friendly message
- Handle other OpenAI errors gracefully

### New Frontend Files

| File | Purpose |
|---|---|
| `src/hooks/useAIRecommendations.tsx` | React Query hook for recommendations (staleTime: 30min) |
| `src/hooks/useAIProfileScore.tsx` | React Query hook for profile health score |
| `src/hooks/useWinProbability.tsx` | Mutation hook for on-demand contract scoring |
| `src/components/dashboard/AIRecommendationsCard.tsx` | Dashboard card showing AI picks |
| `src/components/dashboard/ProfileHealthCard.tsx` | Dashboard card showing profile score + tips |
| `src/components/search/WinScoreModal.tsx` | Modal displaying win probability details |

### Modified Files

| File | Change |
|---|---|
| `src/pages/Dashboard.tsx` | Add AIRecommendationsCard and ProfileHealthCard |
| `src/pages/SearchHub.tsx` | Add "Score This" button on contract cards |
| `src/components/tracked/NotesModal.tsx` | Add "Analyze Fit" button |
| `supabase/functions/ai-opportunity-chat/index.ts` | Switch from Lovable AI Gateway to OpenAI |
| `supabase/config.toml` | Register 3 new edge functions |

### Error Handling (consistent across all functions)
- **429 Too Many Requests**: Retry once after 2 seconds, then show toast: "AI is busy, please try again in a moment"
- **401 Unauthorized**: Redirect to login
- **500 Server Error**: Show toast with generic error message
- All toasts use existing `useToast` hook

### Rate Limit Strategy
- Dashboard recommendations cached 30 minutes (React Query staleTime)
- Profile optimizer runs only on-demand or once per session
- Win scoring is user-triggered (button click), no automatic calls

