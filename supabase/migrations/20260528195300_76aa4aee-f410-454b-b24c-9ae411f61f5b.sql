ALTER TABLE public.sync_runs DROP CONSTRAINT IF EXISTS sync_runs_status_check;
ALTER TABLE public.sync_runs ADD CONSTRAINT sync_runs_status_check CHECK (status IN ('running','success','failure','cancelled'));
UPDATE public.sync_runs SET status='cancelled', finished_at=now() WHERE status='running' AND started_at < now() - interval '5 minutes';