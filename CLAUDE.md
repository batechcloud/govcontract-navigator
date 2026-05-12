# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: both `bun.lockb` and `package-lock.json` exist — `npm` is the documented path (README), `bun` works too. Pick one and stay consistent within a change.

- `npm run dev` — Vite dev server on `http://localhost:8080` (port hardcoded in [vite.config.ts](vite.config.ts))
- `npm run build` — production build; runs the `secretScannerPlugin` from [scripts/secret-scanner.ts](scripts/secret-scanner.ts) on the output and **fails the build** if secrets (non-anon JWTs, API keys, private keys) are found in the bundle
- `npm run build:dev` — development-mode build (skips secret scanner, enables `lovable-tagger`)
- `npm run lint` — ESLint over `**/*.{ts,tsx}`. Note: `@typescript-eslint/no-unused-vars` is **off** ([eslint.config.js](eslint.config.js)); `tsconfig.json` has `strictNullChecks: false` and `noImplicitAny: false`
- `npm run preview` — preview built output
- No test runner is configured.

Supabase Edge Functions live in [supabase/functions/](supabase/functions/) and run on Deno (imports via `https://esm.sh/...`). Migrations under [supabase/migrations/](supabase/migrations/) are applied via the Supabase CLI / dashboard; project ref is in [supabase/config.toml](supabase/config.toml).

## Architecture

This is the frontend + serverless backend for **GC Navigator**, a SaaS that helps small businesses find, track, and respond to U.S. federal contracting opportunities (SAM.gov + USASpending.gov + AI assistance).

### Stack at a glance

- **Frontend**: Vite + React 18 + TypeScript + React Router 6 + Tailwind + shadcn-ui (Radix primitives in [src/components/ui/](src/components/ui/))
- **Server state**: `@tanstack/react-query` (defaults set in [App.tsx](src/App.tsx#L55-L64): `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`)
- **Local persisted state**: Zustand with `persist` middleware — see [src/store/contractStore.ts](src/store/contractStore.ts)
- **Backend**: Supabase (Postgres + Auth + Edge Functions). Frontend client: [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts); generated DB types: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) — **do not hand-edit**, regenerate via Supabase CLI
- **Path alias**: `@/*` → `src/*` (see [vite.config.ts](vite.config.ts), [tsconfig.json](tsconfig.json))

### Routing and access tiers

All routes are declared in [src/App.tsx](src/App.tsx) and every page component is `React.lazy`. Three access layers wrap routes:

- `PublicOnlyRoute` — redirects authed users away from `/auth`
- `ProtectedRoute` — requires Supabase session; by default also requires `profile.onboarding_completed` (override with `requireOnboarding={false}` for the onboarding page itself). See [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx)
- `AdminRoute` — separate `/admin/*` area with its own login at `/admin/login`. See [src/components/auth/AdminRoute.tsx](src/components/auth/AdminRoute.tsx)

Many `/dashboard/*` paths exist purely as `<Navigate>` redirects from removed routes — don't delete them without checking inbound links.

### Data flow: search and contracts

Contract search **does not call SAM.gov from the client**. The flow is:

1. Admin-triggered jobs run edge functions [sam-sync-control](supabase/functions/sam-sync-control/) / [sam-sync-incremental](supabase/functions/sam-sync-incremental/) (shared logic in [supabase/functions/_shared/sam-sync.ts](supabase/functions/_shared/sam-sync.ts)) to ingest SAM.gov opportunities into the Postgres `contracts` table.
2. The client reads only from the local `contracts` table via Supabase queries in [src/hooks/useSearch.tsx](src/hooks/useSearch.tsx) (see `useSearchContracts`).
3. Natural-language queries are first run through the [parse-search-query](supabase/functions/parse-search-query/) edge function (`useParseSearchQuery` → `useSmartSearch`), which returns a structured `SearchFilters` shape before the DB query runs.

USASpending data is a separate live path through [usaspending-search](supabase/functions/usaspending-search/) — see [src/hooks/useUSASpending.tsx](src/hooks/useUSASpending.tsx).

Set-aside codes are stored in raw SAM.gov form (`SBP`, `SBA`, `SDVOSBC`, …) and mapped to user-facing labels in both directions — `SET_ASIDE_RAW_TO_LABEL` in `_shared/sam-sync.ts` (write path) and `SET_ASIDE_LABEL_TO_RAW` in `useSearch.tsx` (read/filter path). Keep these in sync.

### Feature gating and rate limits

Subscription-tier feature access goes through [src/hooks/useFeatureAccess.tsx](src/hooks/useFeatureAccess.tsx), which combines:
- A local check against `plan_features` rows for boolean features
- An RPC call to `check_feature_access(_user_id, _feature_code)` for usage-metered features
- `useIncrementUsage` calls `increment_feature_usage` and invalidates both `feature-access` and `feature-usage` query keys

Cross-cutting rate limiting is enforced in edge functions via `check_and_increment_rate_limit` (DB function). Functions are expected to surface 429s with a reset time — the UI uses `toast.warning` for these (not `toast.error`).

### AI features

Each AI capability is its own edge function: [ai-opportunity-chat](supabase/functions/ai-opportunity-chat/), [ai-generate-proposal](supabase/functions/ai-generate-proposal/), [ai-contract-score](supabase/functions/ai-contract-score/), [ai-contract-summary](supabase/functions/ai-contract-summary/), [ai-document-summary](supabase/functions/ai-document-summary/), [ai-profile-optimizer](supabase/functions/ai-profile-optimizer/), [ai-recommend-contracts](supabase/functions/ai-recommend-contracts/). The matching React hooks (`useAIProfileScore`, `useAIRecommendations`, `useWinProbability`, etc.) live in [src/hooks/](src/hooks/) and call them via `supabase.functions.invoke()`.

A separate **client-side heuristic score** ([src/lib/heuristic-score.ts](src/lib/heuristic-score.ts)) is computed instantly per result card from NAICS / set-aside / deadline — used as the fast default; AI scoring is on-demand.

### Edge function conventions

- Every function in [supabase/config.toml](supabase/config.toml) has `verify_jwt = false` — JWT verification is done **manually inside each function** using the `Authorization` header. Do not rely on Supabase's built-in JWT gate; add the manual check when creating a new function.
- The frontend never holds the `service_role` key. The build-time secret scanner ([scripts/secret-scanner.ts](scripts/secret-scanner.ts)) will fail the build if any non-anon JWT, OpenAI/Anthropic/Stripe/AWS/Google key, or private key block ends up in the client bundle. Only Supabase `role: "anon"` JWTs are allowlisted.

### shadcn / UI

UI primitives are checked into [src/components/ui/](src/components/ui/) and configured in [components.json](components.json) (style: default, baseColor: slate, alias `@/components/ui`). They're customized — modify in place rather than re-generating from the shadcn CLI.

## Lovable

This repo is connected to a Lovable project; the `lovable-tagger` Vite plugin runs in development mode only, and changes pushed to git sync back to Lovable. Avoid hand-editing [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) (regenerated) and don't introduce build-time behaviors that conflict with the `componentTagger`/`secretScannerPlugin` toggle in [vite.config.ts](vite.config.ts).
