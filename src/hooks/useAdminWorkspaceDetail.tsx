import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WorkspaceDetail = {
  workspace: { id: string; name: string; created_at: string; owner_id: string };
  owner: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    signed_up_at: string;
    last_active_at: string | null;
    is_suspended: boolean;
  };
  subscription: {
    plan_name: string;
    status: string;
    monthly_price: number | null;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;
  counts: {
    members: number;
    tracked_contracts: number;
    saved_searches: number;
    proposals: number;
  };
  role_breakdown: Record<string, number> | null;
  recent_activity: Array<{
    id: string;
    action: string;
    created_at: string;
    actor_id: string | null;
    details: Record<string, unknown>;
  }>;
};

export function useAdminWorkspaceDetail(workspaceId: string | null) {
  return useQuery({
    queryKey: ["admin-workspace-detail", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_workspace_detail" as any, {
        _workspace_id: workspaceId,
      });
      if (error) throw error;
      return data as unknown as WorkspaceDetail;
    },
  });
}

export function useAdminSetMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { workspace_id: string; user_id: string; role: "viewer" | "editor" }) => {
      const { data, error } = await supabase.functions.invoke("admin-workspace-set-member-role", {
        body: p,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-workspace-members", v.workspace_id] });
      qc.invalidateQueries({ queryKey: ["admin-workspace-detail", v.workspace_id] });
    },
  });
}

export function useAdminRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { workspace_id: string; user_id: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-workspace-remove-member", {
        body: p,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-workspace-members", v.workspace_id] });
      qc.invalidateQueries({ queryKey: ["admin-workspace-detail", v.workspace_id] });
      qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
    },
  });
}
