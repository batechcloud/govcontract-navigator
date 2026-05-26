CREATE OR REPLACE FUNCTION public.admin_recent_signups(_limit integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  created_at timestamptz,
  is_suspended boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.created_at, COALESCE(p.is_suspended, false)
  FROM public.profiles p
  WHERE public.is_admin(auth.uid())
  ORDER BY p.created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.admin_recent_signups(integer) TO authenticated;