
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contracts"
  ON public.contracts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages contracts"
  ON public.contracts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

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
VALUES ('sam_sync', now() - interval '6 months', 0);

CREATE TRIGGER handle_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_sync_metadata_updated_at
  BEFORE UPDATE ON public.sync_metadata
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
