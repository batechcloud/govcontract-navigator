CREATE POLICY "Users can update their competitor awards"
ON public.competitor_awards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.user_documents FOR UPDATE
USING (auth.uid() = user_id);