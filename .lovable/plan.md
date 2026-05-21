
# GC Navigator — Product Requirements Document
**Version 2.0 · Engineering Handoff Edition · May 21, 2026**

> Note: I'm in plan mode, so I can't write a .docx to disk. The full PRD is below — approve this plan (or switch to default mode) and I'll export it as `GC_Navigator_PRD.docx` for you to hand to the developer.

---

## 1. Executive Summary

GC Navigator is a SaaS web application that helps U.S. small businesses **discover, evaluate, track, and bid on federal contracting opportunities**. It aggregates SAM.gov and USASpending.gov data, layers AI intelligence (recommendations, win-probability scoring, proposal drafting, conversational research), and presents it through a beginner-friendly UI that replaces government jargon with plain language.

It is differentiated from GovWin IQ / Deltek / Bloomberg Government by being **priced for SMBs**, **AI-first instead of data-dump-first**, and **opinionated about workflow** (Search → Save → Bid pipeline, not a raw data lake).

- **Live URLs**: Preview `id-preview--e4501e4e.lovable.app` · Production `gc-navigator.lovable.app`
- **Stack**: React 18 + Vite + TypeScript + Tailwind + shadcn-ui · Supabase (Postgres + Auth + Storage + Edge Functions) · OpenAI GPT-4o-mini + Gemini · Stripe

---

## 2. Vision & Value Delivered

**Vision:** Become the default contracting workspace for SMBs that lack a dedicated business-development team.

| Capability | What the user gets |
|---|---|
| **Discovery** | Cached, filterable index of every active SAM.gov opportunity (daily refresh, 6-month window) + historical USASpending awards |
| **Prioritization** | Instant heuristic Fit Score on every card + on-demand AI Win Probability with Bid/No-Bid rationale |
| **Workflow** | Save → Kanban pipeline (6 stages) with notes, priorities, analytics, CSV export |
| **Proposal Generation** | AI first-draft proposals from contract + profile + uploaded docs; DOCX export |
| **Conversational Research** | AI chat grounded in contract + profile + uploaded docs (Gemini multimodal for PDFs/DOCX) |
| **Market Intelligence** | USASpending dashboards: agency spend, geography, top recipients, set-aside trends |
| **Compliance Artifacts** | Auto-generated 1-page Capability Statement |

---

## 3. Target Users

| Persona | Role | Goal | Willingness to Pay |
|---|---|---|---|
| Independent Contractor | Owner/operator (1–10 employees) | 3–5 qualified bids/month | $50–150/mo (Pro) |
| BD Manager | Mid-market BD lead | 20+ opportunity quarterly pipeline | $200–500/mo (Enterprise) |
| Set-Aside-Eligible SMB | WOSB / 8(a) / SDVOSB / HUBZone owner | Find restricted-competition contracts | $50–150/mo (Pro) |

---

## 4. Information Architecture

### 4.1 Public Marketing Site
- `/` Landing (Hero, Trusted By, Features, Comparison, Testimonials, Pricing, CTA)
- `/solutions`, `/pricing`, `/about`, `/contact`, `/blog`, `/docs`, `/tutorials`, `/help`
- `/privacy`, `/terms`
- `/auth`, `/forgot-password`, `/reset-password`

### 4.2 Authenticated App (6 Core Sections)

| Route | Section | Purpose |
|---|---|---|
| `/onboarding` | Onboarding Wizard | 4 steps: Welcome → Company Info → Capabilities (NAICS/PSC) → Preferences |
| `/dashboard` | Dashboard Home | Profile Health, AI Recommendations, Stats, Quick Actions |
| `/dashboard/search` | Search Hub | Primary discovery (SAM cache + filters + saved searches + quick filters) |
| `/dashboard/tracked` | My Opportunities | Kanban + List view + analytics + notes/priorities |
| `/dashboard/ai` | AI Assistant | Persisted conversations, deep-link via `?q=` |
| `/dashboard/proposals` | Proposals | List, AI generator (animated), inline editor, DOCX export |
| `/dashboard/company` | Company Profile | Editable profile + NAICS/PSC selectors + business documents (10MB) |
| `/dashboard/usaspending` | USASpending Intel | Trends, top agencies/recipients, geographic, small-biz intel |
| `/dashboard/sectors` | Sector Browse | 24 industry categories → NAICS → Search |
| `/dashboard/contract/:id` | Contract Detail | 7-section AI summary, attachments, Save/Bid/Ask-AI CTAs |
| `/capability-statement` | Capability Statement | Generated 1-page PDF from profile |
| `/dashboard/settings` | Settings | Account, subscription (Stripe portal), billing |

### 4.3 Admin Area (separate login)
- `/admin/login` – allowlisted (server-enforced)
- `/admin/sync` – SAM.gov sync control: Incremental & Full Import
- `/admin/sync/jobs/:id` – per-job checkpoint, progress, errors
- `/admin/audit` – audit log of admin actions

---

## 5. Feature Specifications

### 5.1 Authentication & Onboarding
- Supabase Auth (email/password + password reset)
- Strict RLS on every user-owned table; roles in **separate `user_roles` table** with `has_role()` security-definer function (never on `profiles`)
- 4-step onboarding sets `profile.onboarding_completed`; `ProtectedRoute` redirects until complete
- Separate `AdminRoute` with allowlist enforced server-side via `admin-sync-allowlist`

### 5.2 Contract Search (Search Hub)
- Reads only from local `contracts` cache table — **never calls SAM.gov from the client**
- Natural-language query → `parse-search-query` edge function (GPT-4o-mini) → structured filters
- Filters: keyword, sector/NAICS, $ range, set-aside (SB/8(a)/WOSB/HUBZone/SDVOSB), agency, contract type, date range, state, active-only, expiring-soon
- Quick-filter chip row + Saved Searches (CRUD)
- Pagination with auto-scroll batching (works around 1000-opportunity API limit) + client dedup
- Each card shows instant **heuristic Fit Score** (NAICS match + set-aside + deadline runway) as a qualitative label
- URL-based filter persistence for shareable links
- **Rate limit: 50 searches/user/day** (`check_and_increment_rate_limit`)

### 5.3 Contract Detail
- Multi-layer fallback: cache → `sam-refresh-single` → graceful warning toast
- 7-section AI summary: Overview, Requirements, Eligibility, Timeline, Evaluation, Risks, Recommendation
- Attachments rendered via **AI Document Intelligence** (Gemini multimodal on base64 PDFs/DOCX)
- Save-to-Pipeline, Generate-Proposal, Ask-AI deep link (`?q=`)
- On-demand **Win Probability** (0–100, Bid/No-Bid + factor breakdown)

### 5.4 My Opportunities (Pipeline)
- Kanban with 6 stages: Researching · Qualifying · Bidding · Submitted · Won · Lost (drag-and-drop via `@hello-pangea/dnd`)
- List view alternative; preference persisted in localStorage
- Per-contract: notes, priority (low/med/high), status, metadata
- Pipeline analytics: count & $ by stage, win rate
- Filters: search, priority, stage
- CSV export with sanitization
- Zustand store synced to `tracked_contracts`

### 5.5 AI Assistant (Opportunity Chat)
- Conversation persistence (`conversations` + `messages` tables) via `useConversations`
- Context fed into prompt: company profile + uploaded docs + current contract (if deep-linked)
- Deep linking from any page via `?q=`
- GPT-4o-mini (unified across all AI features)

### 5.6 Proposal Generator
- Multi-step generation: 48-second animated progress with stage labels + confetti on success
- Inputs: target contract + profile + uploaded business documents
- Inline editor; exports DOCX (via `docx` lib) and plain text
- Stored per-user in `proposals`

### 5.7 Company Profile & Business Documents
- Editable fields: company info, capabilities, past performance, certifications
- NAICS Code Selector + PSC Code Selector (typeahead, multi-select)
- Document upload to Supabase Storage; 10MB limit; inline previews
- Documents feed AI proposal, chat, recommendations
- **AI Profile Optimizer** scores completeness with suggestions

### 5.8 USASpending Intelligence
- Live API with 150ms throttle delay
- Components: Spending Snapshot, Trends, Top Agencies, Top Recipients, Geographic Spending, Small Business Intel, Spending by Category, Award Explorer
- Per-capita & small-business-share derived metrics

### 5.9 Capability Statement Generator
- 1-page compliant federal vendor PDF from profile; downloadable

### 5.10 Sector Browse
- 24 categories with consistent NAICS mapping (`src/config/sectors.ts` — shared with USASpending & recommendations)
- Color-coded cards with live counts; click filters Search Hub

### 5.11 Subscription & Billing
- Two tiers: **Pro** and **Enterprise**. Prices hidden on marketing (CTA = "Book a Demo")
- Stripe customer portal for self-serve management (Settings)
- Feature gates: `plan_features` + `check_feature_access` RPC; metered features via `increment_feature_usage`

### 5.12 Admin: SAM.gov Sync Pipeline
- Daily 06:00 UTC `pg_cron` → `sam-sync-incremental` (last 24h delta)
- Manual Incremental or **Full Import** (last 6 months — SAM API max lookback)
- **Self-reinvocation pattern**: workers hit 200s wall-time budget → checkpoint → fire `continue_full` to `sam-sync-control` → exit; chain runs until done
- Stale-job detection: jobs without heartbeat for 60s force-cancellable; jobs idle >5min auto-failed by `start_full`
- Full audit logging

---

## 6. Technical Architecture

### 6.1 Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Routing | React Router v6 (all pages `React.lazy`) |
| UI | Tailwind v3 + shadcn-ui (Radix) |
| Server State | TanStack React Query v5 (stale 5m, gc 24h, persisted to localStorage) |
| Local State | Zustand (persist middleware) |
| Animation | Framer Motion 12 |
| Charts | Recharts |
| DnD | @hello-pangea/dnd |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions on Deno) |
| AI | OpenAI GPT-4o-mini (unified) + Gemini (document multimodal) |
| Export | docx, file-saver |
| Payments | Stripe (customer portal) |

### 6.2 Key Tables
- **`contracts`** — global read-only SAM.gov cache (GIN-indexed via `pg_trgm`)
- **`profiles`** — per-user profile + onboarding flag
- **`user_roles`** — separate roles table + `has_role()` security-definer
- **`tracked_contracts`** — saved opportunities (status, priority, notes)
- **`saved_searches`** — persisted filter configs
- **`proposals`** — generated drafts
- **`conversations` + `messages`** — AI chat history
- **`business_documents`** — Supabase Storage references
- **`sync_jobs` + `sync_audit_logs`** — sync orchestration & audit
- **`plan_features` + `feature_usage`** — subscription gating/metering
- **`rate_limits`** — per-user counters

### 6.3 Edge Functions
All Deno; `verify_jwt=false` in config — **JWT verified manually inside each function**. Zod validation on inputs. Service-role key never exposed to client.

- SAM ingestion: `sam-sync-control`, `sam-sync-incremental`, `sam-refresh-single`, `sam-search`
- Search: `parse-search-query`
- AI: `ai-opportunity-chat`, `ai-generate-proposal`, `ai-contract-score`, `ai-contract-summary`, `ai-document-summary`, `ai-profile-optimizer`, `ai-recommend-contracts`
- Market: `usaspending-search`
- Subscription: `check-feature-access`
- Admin: `admin-setup`, `admin-invite`, `admin-sync-allowlist`, `admin-audit-login`

### 6.4 Security
- RLS on every user table; policies use `has_role()` to avoid recursion
- Build-time secret scanner (`scripts/secret-scanner.ts`) fails build on non-anon JWTs, OpenAI/Stripe/AWS keys, private keys in bundle
- Manual JWT verification in every edge function
- Admin allowlist enforced server-side
- SSRF mitigations on external fetches

### 6.5 Performance & Resilience
- All pages `React.lazy` + Suspense
- React Query persisted to localStorage (24h) — AI cards & profile survive reload
- Multi-layer retry on external APIs; 429s preserved (toast.warning, not toast.error)
- Local fallbacks for generative AI on API failure
- Standardized `animate-shimmer` skeletons; framer-motion logo loader for AI

---

## 7. Design System
- **Aesthetic**: Dark glassmorphic, Bloomberg-Terminal-inspired but beginner-friendly
- **Color tokens (HSL only, `index.css`)**: navy bg `#0D1121`, primary `#4A5BA8`
- **Typography**: Montserrat (headings), Open Sans (body) — never Inter/Poppins/serif
- **Layout**: Persistent sidebar at ≥1024px; `DashboardLayout` wraps every authed page
- **Plain-language mappings** (no jargon): e.g. "Direct Contracts" instead of "Prime"; qualitative fit labels instead of raw scores
- 4-step guided onboarding tour (framer-motion, localStorage-persisted dismiss)
- `react-helmet-async` for per-page `<title>` + OpenGraph

---

## 8. Outstanding Work for Engineering

### 8.1 In-Flight
- SAM.gov **Full Import self-reinvocation** — implemented; needs production validation across a full 6-month backfill
- **Cancel-job hardening** (stale-worker auto-finalize at 60s) — implemented; add richer admin UI feedback
- **Security linter warnings** — pre-existing, need triage pass

### 8.2 Recommended Next Features (v1.1+)
- Email alerts on saved searches (cron + Resend/SendGrid)
- Team collaboration (shared pipelines, workspace roles)
- CRM integrations (HubSpot, Salesforce)
- Incumbent research panel on Contract Detail
- State/local government data beyond federal
- Mobile PWA hardening or native app

---

## 9. Success Metrics

| Metric | Target | Window |
|---|---|---|
| Monthly Active Users | 500 | 6 months post-launch |
| Avg. session duration | > 8 minutes | Ongoing |
| Contracts saved / user / month | > 5 | Ongoing |
| Proposals generated / paying user / month | > 2 | Ongoing |
| Data freshness (SAM) | < 24h lag | Ongoing |
| Sync job success rate | > 99% | Ongoing |
| Page TTI (dashboard) | < 2s | At launch |
| AI call p95 latency | < 12s | Ongoing |

---

## 10. Glossary

| Term | Meaning |
|---|---|
| SAM.gov | System for Award Management — federal contracting portal |
| NAICS | North American Industry Classification System (6-digit industry codes) |
| PSC | Product Service Code |
| Set-aside | Contract restricted to a socioeconomic category (SB, 8(a), WOSB, HUBZone, SDVOSB) |
| Fit Score | Client-side heuristic 0–100 match between contract and profile |
| Win Probability | AI-generated 0–100 score with Bid/No-Bid recommendation |
| Capability Statement | Standard 1-page federal vendor marketing document |
| Direct Contracts | User-facing label for "Prime" contracts (plain-language mapping) |

---

**Next step**: Approve this plan and I'll export the PRD as `GC_Navigator_PRD.docx` (and optionally PDF) for handoff.
