
-- Nightly sync rebuild: new isolated tables for SAM + USASpending data,
-- per-source cursors, and a unified run history.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ SAM opportunities ============
CREATE TABLE IF NOT EXISTS public.sam_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id text NOT NULL UNIQUE,
  title text,
  agency text,
  parent_agency text,
  sub_agency text,
  office text,
  description text,
  naics_code text,
  psc_code text,
  set_aside text,
  contract_type text,
  location text,
  value numeric,
  posted_date timestamptz,
  deadline timestamptz,
  solicitation_number text,
  url text,
  resource_links text[] DEFAULT '{}'::text[],
  match_score integer,
  raw jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sam_opportunities TO authenticated;
GRANT ALL ON public.sam_opportunities TO service_role;

ALTER TABLE public.sam_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read sam_opportunities"
  ON public.sam_opportunities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages sam_opportunities"
  ON public.sam_opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sam_opportunities_posted_date_idx
  ON public.sam_opportunities (posted_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS sam_opportunities_naics_idx
  ON public.sam_opportunities (naics_code);
CREATE INDEX IF NOT EXISTS sam_opportunities_agency_idx
  ON public.sam_opportunities (agency);
CREATE INDEX IF NOT EXISTS sam_opportunities_title_trgm_idx
  ON public.sam_opportunities USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS sam_opportunities_description_trgm_idx
  ON public.sam_opportunities USING gin (description gin_trgm_ops);

-- ============ USASpending awards ============
CREATE TABLE IF NOT EXISTS public.usaspending_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id text NOT NULL UNIQUE,
  generated_internal_id text,
  recipient_name text,
  recipient_uei text,
  recipient_duns text,
  awarding_agency text,
  awarding_sub_agency text,
  funding_agency text,
  naics_code text,
  psc_code text,
  award_type text,
  award_type_code text,
  award_amount numeric,
  base_obligation numeric,
  description text,
  date_signed date,
  period_of_performance_start date,
  period_of_performance_end date,
  place_of_performance_state text,
  place_of_performance_city text,
  place_of_performance_country text,
  set_aside text,
  raw jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.usaspending_awards TO authenticated;
GRANT ALL ON public.usaspending_awards TO service_role;

ALTER TABLE public.usaspending_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read usaspending_awards"
  ON public.usaspending_awards FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages usaspending_awards"
  ON public.usaspending_awards FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS usaspending_awards_date_signed_idx
  ON public.usaspending_awards (date_signed DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS usaspending_awards_recipient_uei_idx
  ON public.usaspending_awards (recipient_uei);
CREATE INDEX IF NOT EXISTS usaspending_awards_recipient_name_idx
  ON public.usaspending_awards (recipient_name);
CREATE INDEX IF NOT EXISTS usaspending_awards_naics_idx
  ON public.usaspending_awards (naics_code);
CREATE INDEX IF NOT EXISTS usaspending_awards_agency_idx
  ON public.usaspending_awards (awarding_agency);
CREATE INDEX IF NOT EXISTS usaspending_awards_state_idx
  ON public.usaspending_awards (place_of_performance_state);

-- ============ Sync runs (unified history) ============
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('sam','usaspending')),
  status text NOT NULL CHECK (status IN ('running','success','failure')) DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_fetched integer NOT NULL DEFAULT 0,
  records_inserted integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  pages integer NOT NULL DEFAULT 0,
  last_error text,
  triggered_by uuid,
  manual boolean NOT NULL DEFAULT false,
  window_from timestamptz,
  window_to timestamptz
);

GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can see run history (it can reveal API behavior).
CREATE POLICY "Admins read sync_runs"
  ON public.sync_runs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role manages sync_runs"
  ON public.sync_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sync_runs_source_started_idx
  ON public.sync_runs (source, started_at DESC);

-- ============ Sync cursors (per-source last-success timestamp) ============
CREATE TABLE IF NOT EXISTS public.sync_cursors (
  source text PRIMARY KEY,
  last_synced_at timestamptz,
  last_run_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sync_cursors TO authenticated;
GRANT ALL ON public.sync_cursors TO service_role;

ALTER TABLE public.sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sync_cursors"
  ON public.sync_cursors FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role manages sync_cursors"
  ON public.sync_cursors FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.sync_cursors (source, last_synced_at)
VALUES ('sam', NULL), ('usaspending', NULL)
ON CONFLICT (source) DO NOTHING;

-- Reusable updated_at trigger
CREATE TRIGGER trg_sam_opportunities_updated_at
  BEFORE UPDATE ON public.sam_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_usaspending_awards_updated_at
  BEFORE UPDATE ON public.usaspending_awards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
