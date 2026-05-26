import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  workspace_id: string | null;
  workspace_name: string | null;
  role: string | null;
  plan_name: string;
  subscription_status: string;
  is_suspended: boolean;
  last_active_at: string | null;
  created_at: string;
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users" as any);
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
    staleTime: 30_000,
  });
}
