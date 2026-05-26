
CREATE OR REPLACE FUNCTION public.admin_overview_stats()
RETURNS TABLE(
  total_workspaces int,
  total_users int,
  suspended_users int,
  active_subscriptions int,
  mrr_cents bigint,
  signups_today int,
  signups_7d int,
  signups_30d int,
  cancellations_30d int,
  open_support_threads int,
  failed_sync_records int,
  last_sync_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.workspaces),
    (SELECT COUNT(*)::int FROM public.profiles),
    (SELECT COUNT(*)::int FROM public.profiles WHERE is_suspended = true),
    (SELECT COUNT(*)::int FROM public.user_subscriptions WHERE status = 'active'),
    (SELECT COALESCE(SUM(sp.monthly_price), 0)::bigint
       FROM public.user_subscriptions us
       JOIN public.subscription_plans sp ON sp.id = us.plan_id
      WHERE us.status = 'active'),
    (SELECT COUNT(*)::int FROM public.profiles WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(*)::int FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    (SELECT COUNT(*)::int FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    (SELECT COUNT(*)::int FROM public.user_subscriptions
       WHERE status IN ('cancelled','canceled','inactive')
         AND updated_at >= now() - interval '30 days'),
    (SELECT COUNT(*)::int FROM public.support_threads WHERE status IN ('open','pending')),
    (SELECT COUNT(*)::int FROM public.sync_failed_records WHERE resolved = false),
    (SELECT last_synced_at FROM public.sync_metadata WHERE id = 'sam_sync')
  WHERE public.is_admin(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.admin_signups_timeseries(_days int DEFAULT 30)
RETURNS TABLE(day date, signups int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d::date AS day,
         (SELECT COUNT(*)::int FROM public.profiles p
            WHERE p.created_at >= d AND p.created_at < d + interval '1 day') AS signups
    FROM generate_series(CURRENT_DATE - (_days - 1) * interval '1 day', CURRENT_DATE, interval '1 day') d
   WHERE public.is_admin(auth.uid())
   ORDER BY d;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  workspace_id uuid,
  workspace_name text,
  role workspace_role,
  plan_name text,
  subscription_status text,
  is_suspended boolean,
  last_active_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    w.id AS workspace_id,
    w.name AS workspace_name,
    m.role,
    COALESCE(sp.display_name, 'Starter') AS plan_name,
    COALESCE(us.status, 'none') AS subscription_status,
    COALESCE(p.is_suspended, false) AS is_suspended,
    p.last_active_at,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.workspace_members m ON m.user_id = u.id
  LEFT JOIN public.workspaces w ON w.id = m.workspace_id
  LEFT JOIN public.user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
  LEFT JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE public.is_admin(auth.uid())
  ORDER BY u.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_subscriptions()
RETURNS TABLE(
  subscription_id uuid,
  user_id uuid,
  email text,
  plan_name text,
  status text,
  monthly_price int,
  yearly_price int,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    us.id AS subscription_id,
    us.user_id,
    u.email::text,
    COALESCE(sp.display_name, 'Unknown') AS plan_name,
    us.status,
    sp.monthly_price,
    sp.yearly_price,
    us.current_period_start,
    us.current_period_end,
    us.created_at
  FROM public.user_subscriptions us
  LEFT JOIN auth.users u ON u.id = us.user_id
  LEFT JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE public.is_admin(auth.uid())
  ORDER BY us.created_at DESC;
$$;
