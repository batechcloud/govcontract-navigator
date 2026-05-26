import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminWorkspaceRow = {
  workspace_id: string;
  workspace_name: string;
  workspace_created_at: string;
  owner_id: string;
  owner_email: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_last_active_at: string | null;
  is_suspended: boolean;
  plan_name: string;
  member_count: number;
};

export type AdminWorkspaceMember = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_suspended: boolean;
  joined_at: string;
  last_active_at: string | null;
};

export function useAdminWorkspaces() {
  return useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_workspaces" as any);
      if (error) throw error;
      return (data ?? []) as AdminWorkspaceRow[];
    },
    staleTime: 30_000,
  });
}

export function useAdminWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ["admin-workspace-members", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_workspace_members" as any, {
        _workspace_id: workspaceId,
      });
      if (error) throw error;
      return (data ?? []) as AdminWorkspaceMember[];
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; active: boolean; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-set-user-active", {
        body: payload,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
      qc.invalidateQueries({ queryKey: ["admin-workspace-members"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-overview-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-recent-signups"] });
      qc.invalidateQueries({ queryKey: ["admin-workspace-detail"] });
    },
  });
}
