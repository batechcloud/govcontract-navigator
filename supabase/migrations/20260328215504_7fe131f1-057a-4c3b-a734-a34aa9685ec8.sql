DROP POLICY "Service role manages summaries" ON public.contract_summaries;

CREATE POLICY "Service role manages summaries"
ON public.contract_summaries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);