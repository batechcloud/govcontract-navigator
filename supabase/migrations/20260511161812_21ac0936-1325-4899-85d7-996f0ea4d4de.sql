
-- Fix UPDATE policies to include WITH CHECK preventing user_id reassignment
DROP POLICY IF EXISTS "Users can update their own tracked contracts" ON public.tracked_contracts;
CREATE POLICY "Users can update their own tracked contracts" ON public.tracked_contracts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tracked competitors" ON public.tracked_competitors;
CREATE POLICY "Users can update their own tracked competitors" ON public.tracked_competitors
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their competitor awards" ON public.competitor_awards;
CREATE POLICY "Users can update their competitor awards" ON public.competitor_awards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cached contracts" ON public.cached_contracts;
CREATE POLICY "Users can update their own cached contracts" ON public.cached_contracts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own win/loss records" ON public.win_loss_records;
CREATE POLICY "Users can update their own win/loss records" ON public.win_loss_records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
CREATE POLICY "Users can update their own proposals" ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update their own saved searches" ON public.saved_searches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.user_documents;
CREATE POLICY "Users can update their own documents" ON public.user_documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company profile" ON public.company_profiles;
CREATE POLICY "Users can update their own company profile" ON public.company_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add WITH CHECK to admin policy on user_feature_overrides
DROP POLICY IF EXISTS "Admins can manage overrides" ON public.user_feature_overrides;
CREATE POLICY "Admins can manage overrides" ON public.user_feature_overrides
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
