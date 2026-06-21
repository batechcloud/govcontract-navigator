
## Goal
Avoid repeated SAM.gov + OpenAI calls in `ai-recommend-contracts` when the same user reloads the dashboard. Cache the response server-side for 6 hours, keyed by a hash of the user's profile inputs.

## Approach
Add a new `ai_recommendation_cache` table that stores the most recent recommendation payload per user, with a profile fingerprint and expiry. The edge function checks the cache first and only calls SAM.gov / OpenAI on a miss or when the profile fingerprint changes.

## Database (migration)
```sql
CREATE TABLE public.ai_recommendation_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_hash text NOT NULL,
  payload jsonb NOT NULL,         -- { recommendations, source, ... }
  source text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_recommendation_cache TO authenticated;
GRANT ALL ON public.ai_recommendation_cache TO service_role;

ALTER TABLE public.ai_recommendation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai cache"
  ON public.ai_recommendation_cache FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX ai_recommendation_cache_expires_idx
  ON public.ai_recommendation_cache(expires_at);
```
Writes go through `service_role` from the edge function. No anon access. No client mutations.

## Edge function (`supabase/functions/ai-recommend-contracts/index.ts`)
1. After auth + profile fetch, compute a stable fingerprint:
   - `sha256` of JSON `{ naics, psc, certifications, capabilities, employees, revenue, preferred_agencies }` with arrays sorted.
2. Create a `serviceClient` using `SUPABASE_SERVICE_ROLE_KEY` (separate from the user-auth client) for cache reads/writes.
3. **Cache lookup**: `select payload, profile_hash, expires_at from ai_recommendation_cache where user_id = $userId`.
   - If row exists, `expires_at > now()`, and `profile_hash` matches → return `payload` immediately with header `x-cache: hit`.
4. **Miss / stale / profile changed** → run existing SAM.gov + OpenAI flow unchanged.
5. On a successful response (Branch A or Branch B only — never `busyFallback` / `fallbackFromOpportunities` / `no_profile`), upsert into the cache:
   - `expires_at = now() + 6 hours`
   - `payload = { recommendations, source }`
6. Add a `?fresh=1` query param to bypass cache (used by an optional "refresh" button later; not exposed in UI now).

## Client (`src/hooks/useAIRecommendations.tsx`)
No behavioral change required — React Query `staleTime` stays at 30 min. The server cache is transparent. Optionally lower client `staleTime` to 5 min so users get fresher data once the server cache is in place, but keep current default to minimize churn.

## Cache invalidation
- 6-hour TTL.
- Automatic invalidation when the user edits their profile (fingerprint changes → cache miss).
- No manual purge UI for now; cron cleanup not needed (1 row per user, upserted in place).

## Out of scope
- Sharing cache across users with similar profiles.
- Background refresh / pre-warming.
- Surfacing cache age in the UI.
