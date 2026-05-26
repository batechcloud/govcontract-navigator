
-- ============== Enums =================
DO $$ BEGIN
  CREATE TYPE public.support_thread_status AS ENUM ('open', 'pending', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_sender_type AS ENUM ('workspace', 'admin', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== Tables ================
CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Workspace support',
  status public.support_thread_status NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_for_workspace INTEGER NOT NULL DEFAULT 0,
  unread_for_admin INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members view their support thread"
  ON public.support_threads FOR SELECT TO authenticated
  USING (workspace_id = public.my_workspace_id() OR public.is_admin(auth.uid()));

CREATE POLICY "Workspace members update their support thread"
  ON public.support_threads FOR UPDATE TO authenticated
  USING (workspace_id = public.my_workspace_id() OR public.is_admin(auth.uid()))
  WITH CHECK (workspace_id = public.my_workspace_id() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins insert support threads"
  ON public.support_threads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_support_threads_status_last_msg
  ON public.support_threads(status, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type public.support_sender_type NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own workspace thread"
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND t.workspace_id = public.my_workspace_id()
    )
  );

CREATE POLICY "Workspace users post in own thread"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (sender_type = 'workspace' AND EXISTS (
        SELECT 1 FROM public.support_threads t
        WHERE t.id = thread_id AND t.workspace_id = public.my_workspace_id()
      ))
      OR (sender_type = 'admin' AND public.is_admin(auth.uid()))
    )
  );

CREATE INDEX IF NOT EXISTS idx_support_messages_thread_created
  ON public.support_messages(thread_id, created_at);

-- ============== Trigger: maintain thread bookkeeping ==============
CREATE OR REPLACE FUNCTION public.support_message_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _preview TEXT;
BEGIN
  _preview := COALESCE(NULLIF(left(NEW.body, 160), ''), '[attachment]');

  IF NEW.sender_type = 'workspace' THEN
    UPDATE public.support_threads
       SET last_message_at = NEW.created_at,
           last_message_preview = _preview,
           unread_for_admin = unread_for_admin + 1,
           status = 'open',
           updated_at = now()
     WHERE id = NEW.thread_id;
  ELSIF NEW.sender_type = 'admin' THEN
    UPDATE public.support_threads
       SET last_message_at = NEW.created_at,
           last_message_preview = _preview,
           unread_for_workspace = unread_for_workspace + 1,
           status = CASE WHEN status = 'open' THEN 'pending' ELSE status END,
           updated_at = now()
     WHERE id = NEW.thread_id;
  ELSE
    UPDATE public.support_threads
       SET last_message_at = NEW.created_at,
           last_message_preview = _preview,
           updated_at = now()
     WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_support_message_after_insert ON public.support_messages;
CREATE TRIGGER trg_support_message_after_insert
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.support_message_after_insert();

-- ============== Helper RPC ==============
CREATE OR REPLACE FUNCTION public.get_or_create_support_thread()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ws UUID;
  _thread UUID;
BEGIN
  _ws := public.my_workspace_id();
  IF _ws IS NULL THEN RAISE EXCEPTION 'no workspace'; END IF;

  SELECT id INTO _thread FROM public.support_threads WHERE workspace_id = _ws;
  IF _thread IS NULL THEN
    INSERT INTO public.support_threads (workspace_id) VALUES (_ws) RETURNING id INTO _thread;
  END IF;
  RETURN _thread;
END $$;

GRANT EXECUTE ON FUNCTION public.get_or_create_support_thread() TO authenticated;

-- ============== Storage bucket ==============
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Workspace members can read files under workspace/<their workspace id>/...
CREATE POLICY "Workspace members read own support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      public.is_admin(auth.uid())
      OR (
        (storage.foldername(name))[1] = 'workspace'
        AND (storage.foldername(name))[2] = public.my_workspace_id()::text
      )
    )
  );

CREATE POLICY "Workspace members upload own support attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = 'workspace'
    AND (storage.foldername(name))[2] = public.my_workspace_id()::text
  );

CREATE POLICY "Admins manage support attachments"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'support-attachments' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'support-attachments' AND public.is_admin(auth.uid()));
