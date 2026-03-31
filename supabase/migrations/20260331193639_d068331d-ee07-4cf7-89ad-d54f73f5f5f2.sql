-- Idempotent cleanup: drop any stale user-write policies on user_subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can insert subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update subscriptions" ON public.user_subscriptions;

-- Idempotent cleanup: drop any stale user-write policies on user_roles
DROP POLICY IF EXISTS "Users can manage own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON public.user_roles;

-- Fix: Add UPDATE policy for documents storage bucket
CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);