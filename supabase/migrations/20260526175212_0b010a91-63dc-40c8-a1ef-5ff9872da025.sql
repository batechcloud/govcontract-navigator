
-- Seed temp superadmin email (idempotent)
INSERT INTO public.admin_emails (email)
VALUES ('superadmin.test@gcnavigator.dev')
ON CONFLICT (email) DO NOTHING;

-- RPC: list workspaces with owner + plan + member count, admin-only
CREATE OR REPLACE FUNCTION public.admin_list_workspaces()
RETURNS TABLE (
  workspace_id uuid,
  workspace_name text,
  workspace_created_at timestamptz,
  owner_id uuid,
  owner_email text,
  owner_first_name text,
  owner_last_name text,
  owner_last_active_at timestamptz,
  is_suspended boolean,
  plan_name text,
  member_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id AS workspace_id,
    w.name AS workspace_name,
    w.created_at AS workspace_created_at,
    w.owner_id,
    u.email::text AS owner_email,
    p.first_name AS owner_first_name,
    p.last_name AS owner_last_name,
    p.last_active_at AS owner_last_active_at,
    COALESCE(p.is_suspended, false) AS is_suspended,
    COALESCE(sp.display_name, 'Starter') AS plan_name,
    (SELECT COUNT(*)::int FROM public.workspace_members m WHERE m.workspace_id = w.id) AS member_count
  FROM public.workspaces w
  LEFT JOIN auth.users u ON u.id = w.owner_id
  LEFT JOIN public.profiles p ON p.id = w.owner_id
  LEFT JOIN public.user_subscriptions us ON us.user_id = w.owner_id AND us.status = 'active'
  LEFT JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE public.is_admin(auth.uid())
  ORDER BY w.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_workspaces() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_workspaces() TO authenticated;

-- RPC: list members of a workspace (admin-only)
CREATE OR REPLACE FUNCTION public.admin_list_workspace_members(_workspace_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role workspace_role,
  is_suspended boolean,
  joined_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    m.role,
    COALESCE(p.is_suspended, false) AS is_suspended,
    m.created_at AS joined_at
  FROM public.workspace_members m
  LEFT JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.workspace_id = _workspace_id
    AND public.is_admin(auth.uid())
  ORDER BY (m.role = 'owner') DESC, m.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_workspace_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_workspace_members(uuid) TO authenticated;
