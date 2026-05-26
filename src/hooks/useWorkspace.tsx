import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type WorkspaceRole = "owner" | "editor" | "viewer" | "member";

export type WorkspaceMember = {
  id: string;
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
  created_at: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

// Normalize legacy "member" role to "editor" for display/permission purposes
export const normalizeRole = (r: WorkspaceRole): "owner" | "editor" | "viewer" =>
  r === "member" ? "editor" : (r as "owner" | "editor" | "viewer");

export function useWorkspace() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["workspace", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: myMembership, error: meErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!myMembership) return { workspace: null, members: [] as WorkspaceMember[], myRole: null };

      const [{ data: workspace }, { data: memberRows }] = await Promise.all([
        supabase.from("workspaces").select("*").eq("id", myMembership.workspace_id).maybeSingle(),
        supabase
          .from("workspace_members")
          .select("id, user_id, workspace_id, role, created_at")
          .eq("workspace_id", myMembership.workspace_id),
      ]);

      const ids = (memberRows ?? []).map((m) => m.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", ids)
        : { data: [] as any[] };

      const members: WorkspaceMember[] = (memberRows ?? []).map((m) => {
        const p = (profiles ?? []).find((x: any) => x.id === m.user_id);
        return {
          ...m,
          role: m.role as WorkspaceRole,
          email: m.user_id === user!.id ? user!.email ?? null : null,
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });

      return {
        workspace,
        members,
        myRole: myMembership.role as WorkspaceRole,
      };
    },
  });
}

export function useWorkspacePermissions() {
  const { data } = useWorkspace();
  const role = data?.myRole ? normalizeRole(data.myRole) : null;
  return {
    role,
    isOwner: role === "owner",
    isEditor: role === "editor",
    isViewer: role === "viewer",
    canEdit: role === "owner" || role === "editor",
  };
}
