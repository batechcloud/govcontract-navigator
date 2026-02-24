
-- Create rate limits tracking table
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_name text NOT NULL DEFAULT 'sam_search',
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, api_name, request_date)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rate limits"
  ON public.api_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Atomic check-and-increment function
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  _user_id uuid,
  _api_name text,
  _daily_limit integer
)
RETURNS TABLE(allowed boolean, current_count integer, daily_limit integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO api_rate_limits (user_id, api_name, request_date, request_count)
  VALUES (_user_id, _api_name, CURRENT_DATE, 1)
  ON CONFLICT (user_id, api_name, request_date)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1, updated_at = now()
  RETURNING request_count INTO _count;

  RETURN QUERY SELECT _count <= _daily_limit, _count, _daily_limit;
END;
$$;
