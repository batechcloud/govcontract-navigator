
-- Add workspace_id and switch RLS to workspace-scoped access for tracked_competitors + competitor_awards

ALTER TABLE public.tracked_competitors ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.competitor_awards   ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Backfill from owning user's workspace
UPDATE public.tracked_competitors tc
   SET workspace_id = wm.workspace_id
  FROM public.workspace_members wm
 WHERE tc.workspace_id IS NULL AND wm.user_id = tc.user_id;

UPDATE public.competitor_awards ca
   SET workspace_id = wm.workspace_id
  FROM public.workspace_members wm
 WHERE ca.workspace_id IS NULL AND wm.user_id = ca.user_id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_workspace ON public.tracked_competitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_awards_workspace   ON public.competitor_awards(workspace_id);

-- Drop old user-scoped policies
DROP POLICY IF EXISTS "Users can view their own tracked competitors"   ON public.tracked_competitors;
DROP POLICY IF EXISTS "Users can insert their own tracked competitors" ON public.tracked_competitors;
DROP POLICY IF EXISTS "Users can update their own tracked competitors" ON public.tracked_competitors;
DROP POLICY IF EXISTS "Users can delete their own tracked competitors" ON public.tracked_competitors;

DROP POLICY IF EXISTS "Users can view their competitor awards"   ON public.competitor_awards;
DROP POLICY IF EXISTS "Users can insert their competitor awards" ON public.competitor_awards;
DROP POLICY IF EXISTS "Users can update their competitor awards" ON public.competitor_awards;
DROP POLICY IF EXISTS "Users can delete their competitor awards" ON public.competitor_awards;

-- Workspace-scoped policies: any workspace member can read; editors/owners can write
CREATE POLICY "Workspace members view tracked competitors"
  ON public.tracked_competitors FOR SELECT TO authenticated
  USING (workspace_id = public.my_workspace_id());

CREATE POLICY "Workspace editors insert tracked competitors"
  ON public.tracked_competitors FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = public.my_workspace_id()
    AND public.is_workspace_editor()
    AND user_id = auth.uid()
  );

CREATE POLICY "Workspace editors update tracked competitors"
  ON public.tracked_competitors FOR UPDATE TO authenticated
  USING (workspace_id = public.my_workspace_id() AND public.is_workspace_editor())
  WITH CHECK (workspace_id = public.my_workspace_id() AND public.is_workspace_editor());

CREATE POLICY "Workspace editors delete tracked competitors"
  ON public.tracked_competitors FOR DELETE TO authenticated
  USING (workspace_id = public.my_workspace_id() AND public.is_workspace_editor());

CREATE POLICY "Workspace members view competitor awards"
  ON public.competitor_awards FOR SELECT TO authenticated
  USING (workspace_id = public.my_workspace_id());

CREATE POLICY "Workspace editors insert competitor awards"
  ON public.competitor_awards FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = public.my_workspace_id()
    AND public.is_workspace_editor()
    AND user_id = auth.uid()
  );

CREATE POLICY "Workspace editors update competitor awards"
  ON public.competitor_awards FOR UPDATE TO authenticated
  USING (workspace_id = public.my_workspace_id() AND public.is_workspace_editor())
  WITH CHECK (workspace_id = public.my_workspace_id() AND public.is_workspace_editor());

CREATE POLICY "Workspace editors delete competitor awards"
  ON public.competitor_awards FOR DELETE TO authenticated
  USING (workspace_id = public.my_workspace_id() AND public.is_workspace_editor());

-- Trigger to auto-populate workspace_id on insert when client omits it
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
      FROM public.workspace_members
     WHERE user_id = COALESCE(NEW.user_id, auth.uid())
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracked_competitors_set_workspace ON public.tracked_competitors;
CREATE TRIGGER trg_tracked_competitors_set_workspace
  BEFORE INSERT ON public.tracked_competitors
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

DROP TRIGGER IF EXISTS trg_competitor_awards_set_workspace ON public.competitor_awards;
CREATE TRIGGER trg_competitor_awards_set_workspace
  BEFORE INSERT ON public.competitor_awards
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();
