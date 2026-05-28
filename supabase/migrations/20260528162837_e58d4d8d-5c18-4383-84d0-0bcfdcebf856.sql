
-- Unschedule the legacy daily SAM cron.
DO $$
BEGIN
  PERFORM cron.unschedule('sam-daily-sync');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule the new nightly dispatch at 02:00 UTC.
SELECT cron.schedule(
  'nightly-sync-dispatch',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://omyrlnrqvfofijxwozop.supabase.co/functions/v1/nightly-sync-dispatch',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teXJsbnJxdmZvZmlqeHdvem9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTU3MzIsImV4cCI6MjA4MTEzMTczMn0.xxmfo_xJLUByJbup6lwjgHhFjN6U0Wjf4LY8QfNEE6I"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  ) AS request_id;
  $$
);
