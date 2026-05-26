
DROP FUNCTION IF EXISTS public.admin_list_workspace_members(uuid);

CREATE OR REPLACE FUNCTION public.admin_list_workspace_members(_workspace_id uuid)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, role workspace_role, is_suspended boolean, joined_at timestamp with time zone, last_active_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    m.user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    m.role,
    COALESCE(p.is_suspended, false) AS is_suspended,
    m.created_at AS joined_at,
    p.last_active_at
  FROM public.workspace_members m
  LEFT JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.workspace_id = _workspace_id
    AND public.is_admin(auth.uid())
  ORDER BY (m.role = 'owner') DESC, m.created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.admin_workspace_detail(_workspace_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
  _owner uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT owner_id INTO _owner FROM public.workspaces WHERE id = _workspace_id;
  IF _owner IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'workspace', (SELECT jsonb_build_object(
      'id', w.id, 'name', w.name, 'created_at', w.created_at, 'owner_id', w.owner_id
    ) FROM public.workspaces w WHERE w.id = _workspace_id),
    'owner', (SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'signed_up_at', u.created_at,
      'last_active_at', p.last_active_at,
      'is_suspended', COALESCE(p.is_suspended, false)
    ) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE u.id = _owner),
    'subscription', (SELECT jsonb_build_object(
      'plan_name', COALESCE(sp.display_name, 'Starter'),
      'status', COALESCE(us.status, 'none'),
      'monthly_price', sp.monthly_price,
      'current_period_start', us.current_period_start,
      'current_period_end', us.current_period_end
    ) FROM public.user_subscriptions us
      LEFT JOIN public.subscription_plans sp ON sp.id = us.plan_id
      WHERE us.user_id = _owner AND us.status = 'active'
      LIMIT 1),
    'counts', jsonb_build_object(
      'members', (SELECT COUNT(*) FROM public.workspace_members WHERE workspace_id = _workspace_id),
      'tracked_contracts', (SELECT COUNT(*) FROM public.tracked_contracts tc JOIN public.workspace_members wm ON wm.user_id = tc.user_id WHERE wm.workspace_id = _workspace_id),
      'saved_searches', (SELECT COUNT(*) FROM public.saved_searches ss JOIN public.workspace_members wm ON wm.user_id = ss.user_id WHERE wm.workspace_id = _workspace_id),
      'proposals', (SELECT COUNT(*) FROM public.proposals pr JOIN public.workspace_members wm ON wm.user_id = pr.user_id WHERE wm.workspace_id = _workspace_id)
    ),
    'role_breakdown', (SELECT jsonb_object_agg(role, c) FROM (
      SELECT role::text AS role, COUNT(*) AS c FROM public.workspace_members WHERE workspace_id = _workspace_id GROUP BY role
    ) x),
    'recent_activity', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', al.id, 'action', al.action, 'created_at', al.created_at,
      'actor_id', al.actor_id, 'details', al.details
    ))
      FROM (
        SELECT * FROM public.sync_audit_log
        WHERE (details->>'workspace_id') = _workspace_id::text
           OR actor_id IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = _workspace_id)
        ORDER BY created_at DESC
        LIMIT 15
      ) al
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$function$;
