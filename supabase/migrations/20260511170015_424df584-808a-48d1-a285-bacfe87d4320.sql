
-- Single-source admin allowlist driven by ADMIN_EMAILS secret (synced via edge function).
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write the allowlist (no public/auth access).
DROP POLICY IF EXISTS "Service role manages admin_emails" ON public.admin_emails;
CREATE POLICY "Service role manages admin_emails"
ON public.admin_emails FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Single canonical admin check: returns true iff the user's auth email is in admin_emails.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
    WHERE u.id = _user_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Replace has_role(...,'admin') policies on sync tables with is_admin().
DROP POLICY IF EXISTS "Admins read sync_jobs" ON public.sync_jobs;
DROP POLICY IF EXISTS "Admins write sync_jobs" ON public.sync_jobs;
CREATE POLICY "Admins read sync_jobs" ON public.sync_jobs
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins write sync_jobs" ON public.sync_jobs
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read failed records" ON public.sync_failed_records;
DROP POLICY IF EXISTS "Admins write failed records" ON public.sync_failed_records;
CREATE POLICY "Admins read failed records" ON public.sync_failed_records
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins write failed records" ON public.sync_failed_records
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read audit log" ON public.sync_audit_log;
CREATE POLICY "Admins read audit log" ON public.sync_audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));
