

## Remove AI Helper and Consolidate into AI Chat

The AI Chat page (`/dashboard/ai/chat`) is the more fully-featured implementation with suggested questions, company profile context, streaming, "New chat" button, and better UI. The AI Helper page (`/dashboard/ai`) is a simpler, older version. This plan removes the AI Helper and makes AI Chat the single AI entry point.

### Changes

**1. Update routing (`src/App.tsx`)**
- Remove the `AIAssistant` import
- Change `/dashboard/ai` route to render `AIOpportunityChat` instead of `AIAssistant`
- Remove the separate `/dashboard/ai/chat` route (or redirect it to `/dashboard/ai`)
- Update old-route redirects that point to `/dashboard/ai` (they stay the same, just now land on the chat)

**2. Update sidebar (`src/components/dashboard/DashboardSidebar.tsx`)**
- Remove the separate "AI Helper" and "AI Chat" entries
- Replace with a single "AI Assistant" entry pointing to `/dashboard/ai`

**3. Update Dashboard home cards (`src/pages/Dashboard.tsx`)**
- Change the "Ask AI Helper" card to point to `/dashboard/ai` with updated label (e.g., "AI Assistant")

**4. Update landing page references**
- `FeaturesSection.tsx`: Change "AI Helper Always Available" wording to "AI Assistant Always Available"
- `PricingSection.tsx`: Change "AI Helper chat" to "AI Assistant chat"
- `TestimonialsSection.tsx`: Change "AI Helper" mention to "AI Assistant"

**5. Delete the old AI Helper page**
- Remove `src/pages/AIAssistant.tsx`

**6. Update AI Chat page title**
- In `AIOpportunityChat.tsx`, update the route to reflect it's now at `/dashboard/ai` (no code change needed for this -- routing handles it)

### Technical Details

- The `AIOpportunityChat` page already uses the same `ai-opportunity-chat` edge function, so no backend changes are needed
- All `?q=` query param functionality (e.g., "Ask AI" from contract cards) continues to work since the component handles it
- The edge function and hooks (`useAIProfileScore`, `useWinProbability`, `useAIRecommendations`) are unaffected -- they're used elsewhere in the app

