-- 1. Fix user_subscriptions: remove user INSERT/UPDATE, add service_role-only write policies
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

CREATE POLICY "Service role manages subscriptions"
  ON public.user_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Harden user_roles: add explicit service_role-only write policy
CREATE POLICY "Service role manages roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);