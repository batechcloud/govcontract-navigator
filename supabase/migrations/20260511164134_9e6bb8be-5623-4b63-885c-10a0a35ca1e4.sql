
-- Enums
CREATE TYPE sync_job_type AS ENUM ('full', 'incremental', 'manual');
CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');

-- sync_jobs
CREATE TABLE public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type sync_job_type NOT NULL,
  status sync_job_status NOT NULL DEFAULT 'queued',
  triggered_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  posted_from date,
  posted_to date,
  current_offset integer NOT NULL DEFAULT 0,
  total_records integer,
  records_inserted integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  last_error text,
  cancel_requested boolean NOT NULL DEFAULT false,
  checkpoint jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX idx_sync_jobs_started_at ON public.sync_jobs(started_at DESC);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sync_jobs" ON public.sync_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write sync_jobs" ON public.sync_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages sync_jobs" ON public.sync_jobs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_sync_jobs_updated
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- sync_failed_records
CREATE TABLE public.sync_failed_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  contract_id text,
  payload jsonb,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sync_failed_job ON public.sync_failed_records(job_id);
CREATE INDEX idx_sync_failed_unresolved ON public.sync_failed_records(resolved) WHERE resolved = false;

ALTER TABLE public.sync_failed_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read failed records" ON public.sync_failed_records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write failed records" ON public.sync_failed_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages failed records" ON public.sync_failed_records FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- sync_audit_log
CREATE TABLE public.sync_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sync_audit_created ON public.sync_audit_log(created_at DESC);

ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.sync_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages audit log" ON public.sync_audit_log FOR ALL
  TO service_role USING (true) WITH CHECK (true);
