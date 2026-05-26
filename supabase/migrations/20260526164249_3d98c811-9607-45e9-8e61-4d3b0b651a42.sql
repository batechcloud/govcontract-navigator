
-- Backfill existing 'member' rows to 'editor' to preserve current behavior
UPDATE public.workspace_members SET role = 'editor' WHERE role = 'member';

-- Helper: is the current user an editor-or-owner in their workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_editor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor', 'member')
  )
$$;

-- Update handle_new_user trigger to honor invited_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _workspace_id UUID;
  _invited_to UUID;
  _invited_role workspace_role;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  _invited_to := NULLIF(NEW.raw_user_meta_data ->> 'invited_workspace_id', '')::uuid;
  _invited_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'invited_role', '')::workspace_role,
    'viewer'::workspace_role
  );

  IF _invited_to IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (_invited_to, NEW.id, _invited_role,
            NULLIF(NEW.raw_user_meta_data ->> 'invited_by', '')::uuid)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.workspaces (owner_id, name)
    VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'first_name', '') || '''s Workspace', 'My Workspace'))
    ON CONFLICT (owner_id) DO NOTHING
    RETURNING id INTO _workspace_id;

    IF _workspace_id IS NULL THEN
      SELECT id INTO _workspace_id FROM public.workspaces WHERE owner_id = NEW.id;
    END IF;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (_workspace_id, NEW.id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Rewrite RLS write policies on shared workspace tables to require editor-or-owner

-- tracked_contracts
DROP POLICY IF EXISTS "Workspace insert tracked_contracts" ON public.tracked_contracts;
DROP POLICY IF EXISTS "Workspace update tracked_contracts" ON public.tracked_contracts;
DROP POLICY IF EXISTS "Workspace delete tracked_contracts" ON public.tracked_contracts;

CREATE POLICY "Workspace insert tracked_contracts" ON public.tracked_contracts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_editor());

CREATE POLICY "Workspace update tracked_contracts" ON public.tracked_contracts
  FOR UPDATE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor())
  WITH CHECK (same_workspace_as(user_id) AND public.is_workspace_editor());

CREATE POLICY "Workspace delete tracked_contracts" ON public.tracked_contracts
  FOR DELETE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor());

-- proposals
DROP POLICY IF EXISTS "Workspace create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Workspace update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Workspace delete proposals" ON public.proposals;

CREATE POLICY "Workspace create proposals" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_editor());

CREATE POLICY "Workspace update proposals" ON public.proposals
  FOR UPDATE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor())
  WITH CHECK (same_workspace_as(user_id) AND public.is_workspace_editor());

CREATE POLICY "Workspace delete proposals" ON public.proposals
  FOR DELETE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor());

-- saved_searches
DROP POLICY IF EXISTS "Workspace insert saved_searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Workspace update saved_searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Workspace delete saved_searches" ON public.saved_searches;

CREATE POLICY "Workspace insert saved_searches" ON public.saved_searches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_editor());

CREATE POLICY "Workspace update saved_searches" ON public.saved_searches
  FOR UPDATE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor())
  WITH CHECK (same_workspace_as(user_id) AND public.is_workspace_editor());

CREATE POLICY "Workspace delete saved_searches" ON public.saved_searches
  FOR DELETE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor());

-- company_profiles
DROP POLICY IF EXISTS "Workspace insert company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Workspace update company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Workspace delete company_profiles" ON public.company_profiles;

CREATE POLICY "Workspace insert company_profiles" ON public.company_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_editor());

CREATE POLICY "Workspace update company_profiles" ON public.company_profiles
  FOR UPDATE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor())
  WITH CHECK (same_workspace_as(user_id) AND public.is_workspace_editor());

CREATE POLICY "Workspace delete company_profiles" ON public.company_profiles
  FOR DELETE TO authenticated
  USING (same_workspace_as(user_id) AND public.is_workspace_editor());
