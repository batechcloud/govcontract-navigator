
-- 1. Enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'member');

-- 2. workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. workspace_members table
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id),
  UNIQUE (user_id)
);
GRANT SELECT ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 4. Security definer helpers
CREATE OR REPLACE FUNCTION public.my_workspace_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(_workspace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = auth.uid() AND role = 'owner'
  )
$$;

-- Returns true if the given user_id (row owner) is in the same workspace as the caller.
CREATE OR REPLACE FUNCTION public.same_workspace_as(_other_user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members m1
    JOIN public.workspace_members m2 ON m1.workspace_id = m2.workspace_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = _other_user
  )
$$;

-- 5. RLS policies on workspaces / workspace_members
CREATE POLICY "Members view their workspace"
  ON public.workspaces FOR SELECT TO authenticated
  USING (id = public.my_workspace_id());

CREATE POLICY "Owners update their workspace"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(id))
  WITH CHECK (public.is_workspace_owner(id));

CREATE POLICY "Members view roster"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (workspace_id = public.my_workspace_id());

-- INSERT/DELETE on workspace_members go through service_role (edge functions) only.

-- 6. Backfill: workspace per existing auth user
INSERT INTO public.workspaces (owner_id, name)
SELECT u.id, COALESCE(NULLIF(p.first_name, '') || '''s Workspace', 'My Workspace')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ON CONFLICT (owner_id) DO NOTHING;

INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM public.workspaces w
ON CONFLICT (user_id) DO NOTHING;

-- 7. Extend handle_new_user trigger to provision a workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _workspace_id UUID;
  _invited_to UUID;
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

  -- If this signup was created via workspace invite, the invite function sets
  -- raw_user_meta_data.invited_workspace_id. Attach as member; otherwise create own workspace.
  _invited_to := NULLIF(NEW.raw_user_meta_data ->> 'invited_workspace_id', '')::uuid;

  IF _invited_to IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (_invited_to, NEW.id, 'member',
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
$$;

-- Ensure the trigger exists (re-create idempotently)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Update shared-data RLS to include workspace teammates
-- tracked_contracts
DROP POLICY IF EXISTS "Users can view their own tracked contracts" ON public.tracked_contracts;
DROP POLICY IF EXISTS "Users can insert their own tracked contracts" ON public.tracked_contracts;
DROP POLICY IF EXISTS "Users can update their own tracked contracts" ON public.tracked_contracts;
DROP POLICY IF EXISTS "Users can delete their own tracked contracts" ON public.tracked_contracts;
CREATE POLICY "Workspace view tracked_contracts" ON public.tracked_contracts FOR SELECT TO authenticated USING (public.same_workspace_as(user_id));
CREATE POLICY "Workspace insert tracked_contracts" ON public.tracked_contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workspace update tracked_contracts" ON public.tracked_contracts FOR UPDATE TO authenticated USING (public.same_workspace_as(user_id)) WITH CHECK (public.same_workspace_as(user_id));
CREATE POLICY "Workspace delete tracked_contracts" ON public.tracked_contracts FOR DELETE TO authenticated USING (public.same_workspace_as(user_id));

-- proposals
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON public.proposals;
CREATE POLICY "Workspace view proposals" ON public.proposals FOR SELECT TO authenticated USING (public.same_workspace_as(user_id));
CREATE POLICY "Workspace create proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workspace update proposals" ON public.proposals FOR UPDATE TO authenticated USING (public.same_workspace_as(user_id)) WITH CHECK (public.same_workspace_as(user_id));
CREATE POLICY "Workspace delete proposals" ON public.proposals FOR DELETE TO authenticated USING (public.same_workspace_as(user_id));

-- saved_searches
DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can insert their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches;
CREATE POLICY "Workspace view saved_searches" ON public.saved_searches FOR SELECT TO authenticated USING (public.same_workspace_as(user_id));
CREATE POLICY "Workspace insert saved_searches" ON public.saved_searches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workspace update saved_searches" ON public.saved_searches FOR UPDATE TO authenticated USING (public.same_workspace_as(user_id)) WITH CHECK (public.same_workspace_as(user_id));
CREATE POLICY "Workspace delete saved_searches" ON public.saved_searches FOR DELETE TO authenticated USING (public.same_workspace_as(user_id));

-- company_profiles
DROP POLICY IF EXISTS "Users can view their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can insert their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can delete their own company profile" ON public.company_profiles;
CREATE POLICY "Workspace view company_profiles" ON public.company_profiles FOR SELECT TO authenticated USING (public.same_workspace_as(user_id));
CREATE POLICY "Workspace insert company_profiles" ON public.company_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workspace update company_profiles" ON public.company_profiles FOR UPDATE TO authenticated USING (public.same_workspace_as(user_id)) WITH CHECK (public.same_workspace_as(user_id));
CREATE POLICY "Workspace delete company_profiles" ON public.company_profiles FOR DELETE TO authenticated USING (public.same_workspace_as(user_id));

-- 9. Hard-delete helper (service_role only path)
CREATE OR REPLACE FUNCTION public.delete_user_cascade(_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.tracked_contracts WHERE user_id = _user_id;
  DELETE FROM public.proposals WHERE user_id = _user_id;
  DELETE FROM public.saved_searches WHERE user_id = _user_id;
  DELETE FROM public.company_profiles WHERE user_id = _user_id;
  DELETE FROM public.chat_messages WHERE user_id = _user_id;
  DELETE FROM public.chat_conversations WHERE user_id = _user_id;
  DELETE FROM public.user_documents WHERE user_id = _user_id;
  DELETE FROM public.tracked_competitors WHERE user_id = _user_id;
  DELETE FROM public.competitor_awards WHERE user_id = _user_id;
  DELETE FROM public.win_loss_records WHERE user_id = _user_id;
  DELETE FROM public.cached_contracts WHERE user_id = _user_id;
  DELETE FROM public.feature_usage WHERE user_id = _user_id;
  DELETE FROM public.user_feature_overrides WHERE user_id = _user_id;
  DELETE FROM public.user_subscriptions WHERE user_id = _user_id;
  DELETE FROM public.api_rate_limits WHERE user_id = _user_id;
  DELETE FROM public.workspace_members WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_cascade(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_cascade(UUID) TO service_role;
