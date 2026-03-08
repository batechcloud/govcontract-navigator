CREATE TABLE public.contract_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id)
);

ALTER TABLE public.contract_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read summaries"
  ON public.contract_summaries FOR SELECT
  USING (true);

CREATE POLICY "Service role manages summaries"
  ON public.contract_summaries FOR ALL
  USING (true)
  WITH CHECK (true);