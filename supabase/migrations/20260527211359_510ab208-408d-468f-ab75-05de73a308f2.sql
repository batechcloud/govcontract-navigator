
-- 1) Tighten is_workspace_editor: exclude 'member' (and 'viewer')
CREATE OR REPLACE FUNCTION public.is_workspace_editor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  )
$function$;

-- 2) Add UPDATE/DELETE storage policies for support-attachments
CREATE POLICY "Workspace members update own support attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = 'workspace'
  AND (storage.foldername(name))[2] = (my_workspace_id())::text
)
WITH CHECK (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = 'workspace'
  AND (storage.foldername(name))[2] = (my_workspace_id())::text
);

CREATE POLICY "Workspace members delete own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = 'workspace'
  AND (storage.foldername(name))[2] = (my_workspace_id())::text
);
