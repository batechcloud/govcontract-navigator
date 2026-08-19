CREATE OR REPLACE FUNCTION public.prevent_self_unsuspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_suspended := OLD.is_suspended;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_unsuspend_trg ON public.profiles;
CREATE TRIGGER prevent_self_unsuspend_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_unsuspend();