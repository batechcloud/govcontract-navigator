CREATE TABLE public.ai_recommendation_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_hash text NOT NULL,
  payload jsonb NOT NULL,
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

CREATE TRIGGER ai_recommendation_cache_updated_at
  BEFORE UPDATE ON public.ai_recommendation_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();