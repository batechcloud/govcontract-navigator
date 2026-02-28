
-- Create cached_contracts table for local contract caching
CREATE TABLE public.cached_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_id text NOT NULL,
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
  resource_links text[] DEFAULT '{}'::text[],
  solicitation_number text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);

-- Enable RLS
ALTER TABLE public.cached_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cached contracts"
  ON public.cached_contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached contracts"
  ON public.cached_contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached contracts"
  ON public.cached_contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached contracts"
  ON public.cached_contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cached_contracts_updated_at
  BEFORE UPDATE ON public.cached_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for fast searches
CREATE INDEX idx_cached_contracts_user_id ON public.cached_contracts(user_id);
CREATE INDEX idx_cached_contracts_title ON public.cached_contracts USING gin(to_tsvector('english', coalesce(title, '')));
CREATE INDEX idx_cached_contracts_set_aside ON public.cached_contracts(set_aside);
CREATE INDEX idx_cached_contracts_naics ON public.cached_contracts(naics_code);
