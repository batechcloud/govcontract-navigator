DROP POLICY "Service role manages rate limits" ON public.api_rate_limits;

CREATE POLICY "Service role manages rate limits"
ON public.api_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);