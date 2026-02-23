

# Contract Attachments and AI Document Summarization

## Overview
Add the ability to view all attachments (documents/files) associated with each SAM.gov contract and provide an "AI Summarize" button on each document that generates a concise summary using OpenAI.

## How It Works

The SAM.gov API v2 already returns a `resourceLinks` field -- an array of URLs pointing to downloadable attachments (PDFs, Word docs, etc.) for each opportunity. Currently, the edge function discards this data. This plan captures those links and surfaces them in the Contract Detail page.

---

## Changes

### 1. Update `sam-search` Edge Function
**File:** `supabase/functions/sam-search/index.ts`

- In the `transformSamResults` function, include the `resourceLinks` array from each SAM.gov opportunity in the returned result object
- Pass it through the `cleanResults` step (don't strip it)
- For mock data, include sample `resourceLinks` arrays

### 2. Update the `SearchResult` Interface
**File:** `src/hooks/useSearch.tsx`

- Add `resourceLinks?: string[]` to the `SearchResult` interface so it flows through the app

### 3. Update `contractsApi.js` Normalizer
**File:** `src/services/contractsApi.js`

- Map `resourceLinks` from SAM results into the normalized contract shape
- Default to an empty array for USASpending results (they don't have attachments)

### 4. Update `ContractData` Interface and Detail Page
**File:** `src/pages/ContractDetail.tsx`

- Add `resourceLinks?: string[]` to the `ContractData` interface
- Pass resource links from router state and tracked contracts
- Add a new "Attachments" card section that:
  - Lists each attachment URL with a file icon and the filename (extracted from the URL)
  - Provides a "Download" link (opens in new tab)
  - Provides an "AI Summarize" button on each attachment
  - Shows a loading spinner while summarizing
  - Displays the AI-generated summary inline below the attachment when complete

### 5. Create `ai-document-summary` Edge Function
**File:** `supabase/functions/ai-document-summary/index.ts`

- Accepts `{ documentUrl: string }` in the request body
- Authenticates the user via JWT
- Fetches the document content from the URL server-side (avoids CORS)
- For text-based content: sends the text directly to OpenAI for summarization
- For PDFs/binary files: extracts what text it can from the response and summarizes that; if the content is not readable, returns a message indicating the document format is not supported for summarization
- Uses OpenAI `gpt-4o-mini` (consistent with the rest of the app) with a system prompt focused on government contract document summarization
- Returns `{ summary: string }`
- Handles rate limits (429) and payment errors (402)

### 6. Update `supabase/config.toml`
- Add the new `ai-document-summary` function entry with `verify_jwt = false` (manual JWT check in code)

---

## Technical Details

**SAM.gov `resourceLinks` format:**
The API returns an array of direct download URLs, e.g.:
```
["https://sam.gov/api/prod/opps/v3/opportunities/resources/files/...", ...]
```

**Filename extraction:** Parse the URL to get the filename, or fall back to "Attachment 1", "Attachment 2", etc.

**AI Summarization prompt:** The edge function will instruct the model to:
- Identify the document type (SOW, RFP, amendment, etc.)
- Summarize key requirements, deliverables, and deadlines
- Highlight eligibility criteria and evaluation factors
- Keep the summary concise (300-500 words)

**Attachments UI:** A new card on the Contract Detail page between "Contract Details" and "Action buttons" sections, showing each attachment as a row with download and summarize actions.
