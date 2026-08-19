# GC Navigator — Trust, Navigation & Polish Fixes

Scope excludes SAM.gov sync logic, heuristic scoring, and edge function auth patterns.

## P0 — Trust & monetization

**Remove fabricated social proof**
- `TestimonialsSection.tsx`: replace the 6 invented people (names, Unsplash headshots, company names, metrics) with a neutral "Why small businesses choose GC Navigator" benefit grid — no people, photos, or company names. Remove the stats bar (4.9/5, 10K+, 50K+, 90%).
- `TrustedBySection.tsx`: delete the fake scrolling logo strip; remove its usage from `Index.tsx`.

**Pricing matches the database**
- `PricingSection.tsx`: render three plans from `subscription_plans` — Starter $49/mo ($39/mo yearly), Professional $149/mo ($119/mo yearly), Enterprise $399/mo ($319/mo yearly) — via `useSubscriptionPlans()`, with a static fallback so the marketing page never renders empty. Professional keeps the "Most Popular" badge.
- FAQ "Can I try it for free?" rewritten to describe reality: no self-serve free trial; plans start after a demo/contact.
- `Pricing.tsx`: drop the "Free tier available" meta description claim.

**Consistent Contact Sales (no Stripe this pass)**
- All plan CTAs stay "Book a Demo" → `/contact`.
- `Settings.tsx` billing buttons: replace the "Stripe integration required" toasts with "Contact Sales" actions that link to `/contact` (payment method + billing history blocks reworded to match).

## P1 — Navigation & discoverability

- `DashboardSidebar.tsx`: add **Browse by Industry** (`/dashboard/sectors`) and **Capability Statement** (`/dashboard/capability-statement`) to the nav list.
- `DashboardLayout.tsx`: swap the header `Bell` for `LifeBuoy`, add `aria-label="Support"` and a tooltip; add a Capability Statement item to the account dropdown.
- `Dashboard.tsx`: Getting Started step 3 links to `/dashboard/proposals/generator`.
- Reword "submit" copy in `PricingSection.tsx` FAQ and `FeaturesSection.tsx` to: review and edit, then submit through the agency's official channel and mark it submitted to keep the pipeline current.

## P2 — Polish & accessibility

- `Onboarding.tsx`: "Skip for now" opens a confirm dialog warning that AI recommendations and match scoring need a completed profile, finishable later in Settings.
- Add descriptive `aria-label` to every icon-only button in: `ListView.tsx`, `KanbanCard.tsx`, `OpportunityCard.tsx`, `SectorBrowse.tsx`, `AIOpportunityChat.tsx`, `SavedSearchesList.tsx`, `UsersTab.tsx`, `AwardExplorer.tsx`, `CapabilitiesStep.tsx`, `WorkspaceDetailDrawer.tsx`.
- `Footer.tsx`: remove the newsletter block entirely (form, state, `alert()` handler, unused imports).
- `supabase/functions/sam-search/`: delete it — no frontend call sites (`sam-search` is unreferenced in `src/`); also remove its `supabase/config.toml` entry.

## Technical notes

- Route paths for the two new sidebar entries will be confirmed against `App.tsx` before wiring.
- Pricing card prices read from `subscription_plans` (public read) with a hardcoded fallback matching current DB values.
- No database migrations, no new dependencies.

## Acceptance

No invented people, companies, or statistics on public pages; three plans shown at real DB prices; Sector Browse and Capability Statement reachable from the dashboard; no `alert()` and no button that silently does nothing.
