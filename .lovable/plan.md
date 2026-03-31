

## Plan: Global Contract Cache + Daily Incremental Sync

### Problem
Currently, contracts are cached per-user in `cached_contracts` (each row has a `user_id`). Every user who searches the same terms triggers a separate SAM.gov API call and stores their own copy. This wastes API quota, increases load times, and creates redundant data.

### Solution Overview

1. **Create a shared `contracts` table** — a global cache of SAM.gov opportunities (no `user_id`), keyed by `contract_id`. All users search from this single table.
2. **Create a `sam-sync-incremental` edge function** — fetches only newly posted/modified opportunities from SAM.gov since the last sync.
3. **Set up a daily `pg_cron` job** — invokes the sync function once per day automatically.
4. **Update the search flow** — `useCachedSearch` queries the shared `contracts` table instead of per-user `cached_contracts`. The "Sync from API" action becomes a manual trigger of the same incremental logic.

---

### Technical Details

#### Step 1: New `contracts` table (migration)

```sql
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id text NOT NULL UNIQUE,
  title text,
  agency text,
  description text,
  location text,
  value numeric,
  deadline timestamptz,
  posted_date timestamptz,
  naics_code text,
  set_aside text,
  contract_type text,
  sector text,
  source text DEFAULT 'SAM.gov',
  url text,
  match_score integer,
  resource_links text[] DEFAULT '{}',
  solicitation_number text,
  raw_data jsonb DEFAULT '{}',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_naics ON public.contracts (naics_code);
CREATE INDEX idx_contracts_set_aside ON public.contracts (set_aside);
CREATE INDEX idx_contracts_agency ON public.contracts USING gin (agency gin_trgm_ops);
CREATE INDEX idx_contracts_deadline ON public.contracts (deadline);
CREATE INDEX idx_contracts_posted ON public.contracts (posted_date DESC);
CREATE INDEX idx_contracts_value ON public.contracts (value DESC);
CREATE INDEX idx_contracts_title_desc ON public.contracts 
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- Enable pg_trgm for fuzzy agency search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read contracts"
  ON public.contracts FOR SELECT TO authenticated USING (true);

-- Only service_role can write (sync function uses service role)
CREATE POLICY "Service role manages contracts"
  ON public.contracts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Track last sync metadata
CREATE TABLE public.sync_metadata (
  id text PRIMARY KEY DEFAULT 'sam_sync',
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  last_posted_date timestamptz,
  total_synced integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sync metadata"
  ON public.sync_metadata FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages sync metadata"
  ON public.sync_metadata FOR ALL TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.sync_metadata (id, last_synced_at, total_synced)
VALUES ('sam_sync', now() - interval '1 day', 0);
```

#### Step 2: `sam-sync-incremental` edge function

New edge function at `supabase/functions/sam-sync-incremental/index.ts`:

- Reads `sync_metadata` to get `last_synced_at`
- Calls SAM.gov API with `postedFrom = last_synced_at` and `postedTo = today`
- Paginates through all results (up to 1000 per call, loops with offset)
- Upserts into `contracts` table (on conflict `contract_id`)
- Updates `sync_metadata` with new timestamp and count
- Uses service role client (no user auth needed — called by cron)
- Validates incoming request with a shared secret or the anon key from cron
- Rate-limit aware: stays within SAM.gov's 450/day limit by batching

#### Step 3: Daily cron job (pg_cron + pg_net)

Enable `pg_cron` and `pg_net` extensions, then schedule:

```sql
SELECT cron.schedule(
  'sam-daily-sync',
  '0 6 * * *',  -- 6 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://omyrlnrqvfofijxwozop.supabase.co/functions/v1/sam-sync-incremental',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  ) AS request_id;
  $$
);
```

#### Step 4: Update search hooks

- **`useCachedSearch`**: Change queries from `cached_contracts` with `user_id` filter to `contracts` (no user filter). Remove user-scoped logic.
- **`useSyncFromApi`**: Instead of per-user caching, call the sync function or upsert into the shared table.
- **`useCacheCount`**: Query shared `contracts` table count.
- **Search Hub UI**: "Sync from API" button triggers the incremental sync. Search is instant against the local shared table.
- Keep per-user `tracked_contracts` for pipeline management (bookmarking/status/notes) — unchanged.

#### Step 5: Backfill initial data

The first cron run will use a wider date range (e.g., 6 months) to populate the initial dataset. Subsequent runs will be incremental (last 24-48 hours).

---

### What stays the same
- `tracked_contracts` table (per-user pipeline tracking)
- `contractStore` (Zustand for local UI state)
- Contract Detail page fallback chain
- All existing RLS on other tables

### Benefits
- Search is instant — no API call needed per user search
- SAM.gov quota used efficiently (one daily sync vs. per-user calls)
- All users see the same comprehensive dataset
- Fresh data automatically every day

