import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  plan: SubscriptionPlan;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        throw error;
      }

      if (!data) {
        // Return default starter plan info for users without subscription
        const { data: starterPlan } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("name", "starter")
          .single();

        if (starterPlan) {
          return {
            id: "default",
            user_id: user.id,
            plan_id: starterPlan.id,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: null,
            plan: starterPlan,
          } as UserSubscription;
        }
      }

      return data as UserSubscription;
    },
    enabled: !!user,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("Error fetching plans:", error);
        throw error;
      }

      return data as SubscriptionPlan[];
    },
  });
}
