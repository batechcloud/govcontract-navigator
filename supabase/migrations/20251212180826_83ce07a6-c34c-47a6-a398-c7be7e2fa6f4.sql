-- Create tracked_contracts table for tracking opportunities
CREATE TABLE public.tracked_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contract_id TEXT NOT NULL,
  contract_title TEXT NOT NULL,
  contract_agency TEXT,
  response_deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'watching',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  match_score INTEGER,
  posted_date TIMESTAMPTZ,
  contract_value TEXT,
  set_aside TEXT,
  naics_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contract_id)
);

-- Enable RLS
ALTER TABLE public.tracked_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracked_contracts
CREATE POLICY "Users can view their own tracked contracts"
ON public.tracked_contracts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked contracts"
ON public.tracked_contracts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked contracts"
ON public.tracked_contracts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked contracts"
ON public.tracked_contracts FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_tracked_contracts_updated_at
  BEFORE UPDATE ON public.tracked_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create saved_searches table
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  search_type TEXT DEFAULT 'federal',
  last_run_at TIMESTAMPTZ,
  result_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches"
ON public.saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches"
ON public.saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
ON public.saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
ON public.saved_searches FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();