import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminTeamMember = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "subscription_manager" | "workspace_admin";
  last_active_at: string | null;
  created_at: string;
};

export function useAdminTeam() {
  return useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_team" as any);
      if (error) throw error;
      return (data ?? []) as AdminTeamMember[];
    },
    staleTime: 30_000,
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; role: AdminTeamMember["role"] }) => {
      const { data, error } = await supabase.functions.invoke("admin-team-invite", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-team"] }),
  });
}

export function useUpdateTeamRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; role: AdminTeamMember["role"] }) => {
      const { data, error } = await supabase.functions.invoke("admin-team-update-role", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-team"] }),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("admin-team-remove", { body: { user_id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-team"] }),
  });
}
