DROP POLICY "Anyone can read summaries" ON contract_summaries;
CREATE POLICY "Authenticated users can read summaries" ON contract_summaries FOR SELECT TO authenticated USING (true);