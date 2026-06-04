
-- admin_emails: allow superadmins to read
CREATE POLICY "Admins can view admin_emails"
  ON public.admin_emails FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- workspaces: allow a user to create their own workspace
CREATE POLICY "Users create their own workspace"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- workspace_members: explicit owner-gated writes (+ self-leave)
CREATE POLICY "Owners add workspace members"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Owners update workspace members"
  ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Owners remove workspace members"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Members can leave workspace"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND role <> 'owner');
