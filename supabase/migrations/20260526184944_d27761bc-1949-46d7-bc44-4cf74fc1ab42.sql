
-- Add new admin role values to the app_role enum (must commit before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'subscription_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'workspace_admin';

COMMIT;
BEGIN;

-- =========================================================================
-- Permission helper functions (SECURITY DEFINER, search_path locked).
-- We use ::text comparison to avoid same-transaction enum literal issues.
-- =========================================================================

-- True if user has any admin-tier role (admin / subscription_manager / workspace_admin)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Legacy email-based superadmin
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
      WHERE u.id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role::text IN ('admin','subscription_manager','workspace_admin')
    );
$$;

-- Superadmin = full access. Subscription managers / workspace admins are NOT superadmin.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
      WHERE u.id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role::text = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_subscriptions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role::text = 'subscription_manager'
      );
$$;

CREATE OR REPLACE FUNCTION public.can_impersonate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role::text = 'workspace_admin'
      );
$$;

-- =========================================================================
-- Admin team RPCs (all superadmin-only).
-- =========================================================================

CREATE OR REPLACE FUNCTION public.admin_list_team()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  last_active_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    ur.role::text,
    p.last_active_at,
    ur.created_at
  FROM public.user_roles ur
  LEFT JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE public.is_admin(auth.uid())
    AND ur.role::text IN ('admin','subscription_manager','workspace_admin')
  ORDER BY ur.created_at DESC;
$$;
