# Next Priority Items -- Beyond the Simplification Plan

The simplification plan (.lovable/plan.md) is fully implemented across all 8 phases. Here are the next high-impact items to build, ordered by user value:

---

## 1. Connect AI Helper to Real AI Backend

**Why:** The AI chat currently returns random hardcoded responses. This is the most visible gap.

**What to do:**

- Update `AIAssistant.tsx` to call the existing `ai-opportunity-chat` edge function (or create it if not yet functional)
- Stream responses using the OpenAI API key already configured in secrets
- Pass the user's company profile context so responses are personalized
- Keep the suggestion chips and friendly UI, just wire up real AI responses

**Files:** `src/pages/AIAssistant.tsx`, `supabase/functions/ai-opportunity-chat/index.ts` (create if needed)

---

## 2. Add Status Change to Tracked Contracts

**Why:** Users can save contracts but can't move them between tabs (Saved -> In Progress -> Completed). The tabs exist but there's no way to change status.

**What to do:**

- Add a simple dropdown or button group on each contract card to change status
- Map statuses: "watching" = Saved, "qualifying"/"proposal"/"submitted" = In Progress, "won"/"lost" = Completed
- Use the existing `useTrackedContracts` hook's update capability (or add an update mutation)

**Files:** `src/pages/TrackedContracts.tsx`, `src/hooks/useTrackedContracts.tsx` (add update mutation)

---

## 5. NAICS Code Searchable Dropdown

**Why:** The plan called for replacing raw NAICS code input with a searchable dropdown showing industry names. Currently it's just a text input in the advanced section.

**What to do:**

- Create a NAICS code lookup component with a curated list of common codes + descriptions
- Use a combobox/command component (already have `cmdk` installed)
- Display as "541511 - Custom Computer Programming" instead of just "541511"
- Add to Company Profile page in place of the current NAICS input

**Files:** New `src/components/company/NaicsCodeSelector.tsx`, update `src/pages/CompanyProfile.tsx`

---

## Technical Notes

- The OpenAI API key (`OPENAI_API_KEY`) is already configured in Supabase secrets
- The `docx` and `file-saver` packages are installed for document exports
- All database tables have proper RLS policies in place
- No database schema changes are needed for items 1-4; item 5 is UI-only