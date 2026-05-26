import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminSubscriptionRow = {
  subscription_id: string;
  user_id: string;
  email: string | null;
  plan_name: string;
  status: string;
  monthly_price: number;
  yearly_price: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
};

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_subscriptions" as any);
      if (error) throw error;
      return (data ?? []) as AdminSubscriptionRow[];
    },
    staleTime: 30_000,
  });
}
