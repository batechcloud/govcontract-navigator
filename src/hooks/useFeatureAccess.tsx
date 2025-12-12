import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

export interface FeatureAccess {
  has_access: boolean;
  can_use: boolean;
  usage_limit: number | null;
  current_usage: number;
  remaining: number | null;
  is_override: boolean;
}

export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  feature_type: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  usage_limit: number | null;
  feature: Feature;
}

// Get all features available to the user's current plan
export function usePlanFeatures() {
  const { data: subscription } = useSubscription();

  return useQuery({
    queryKey: ["plan-features", subscription?.plan_id],
    queryFn: async (): Promise<PlanFeature[]> => {
      if (!subscription?.plan_id) return [];

      const { data, error } = await supabase
        .from("plan_features")
        .select(`
          *,
          feature:features(*)
        `)
        .eq("plan_id", subscription.plan_id);

      if (error) {
        console.error("Error fetching plan features:", error);
        throw error;
      }

      return data as PlanFeature[];
    },
    enabled: !!subscription?.plan_id,
  });
}

// Check if user has access to a specific feature
export function useFeatureAccess(featureCode: string) {
  const { user } = useAuth();
  const { data: planFeatures } = usePlanFeatures();

  return useQuery({
    queryKey: ["feature-access", user?.id, featureCode],
    queryFn: async (): Promise<FeatureAccess> => {
      if (!user) {
        return {
          has_access: false,
          can_use: false,
          usage_limit: null,
          current_usage: 0,
          remaining: null,
          is_override: false,
        };
      }

      // First check plan features locally for boolean features
      const planFeature = planFeatures?.find(pf => pf.feature?.code === featureCode);
      
      if (planFeature && planFeature.feature?.feature_type === 'boolean') {
        return {
          has_access: planFeature.is_enabled,
          can_use: planFeature.is_enabled,
          usage_limit: null,
          current_usage: 0,
          remaining: null,
          is_override: false,
        };
      }

      // For usage-based features, call the RPC function
      const { data, error } = await supabase.rpc('check_feature_access', {
        _user_id: user.id,
        _feature_code: featureCode,
      });

      if (error) {
        console.error("Error checking feature access:", error);
        return {
          has_access: false,
          can_use: false,
          usage_limit: null,
          current_usage: 0,
          remaining: null,
          is_override: false,
        };
      }

      const access = data?.[0] || { has_access: false, usage_limit: null, current_usage: 0, is_override: false };
      const withinLimit = access.usage_limit === null || access.current_usage < access.usage_limit;

      return {
        has_access: access.has_access,
        can_use: access.has_access && withinLimit,
        usage_limit: access.usage_limit,
        current_usage: access.current_usage,
        remaining: access.usage_limit ? Math.max(0, access.usage_limit - access.current_usage) : null,
        is_override: access.is_override,
      };
    },
    enabled: !!user && !!planFeatures,
  });
}

// Increment usage for a feature
export function useIncrementUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (featureCode: string) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc('increment_feature_usage', {
        _user_id: user.id,
        _feature_code: featureCode,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, featureCode) => {
      queryClient.invalidateQueries({ queryKey: ["feature-access", user?.id, featureCode] });
      queryClient.invalidateQueries({ queryKey: ["feature-usage", user?.id] });
    },
  });
}

// Get all feature usage for the current period
export function useFeatureUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["feature-usage", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("feature_usage")
        .select(`
          *,
          feature:features(*)
        `)
        .eq("user_id", user.id)
        .gte("period_end", new Date().toISOString());

      if (error) {
        console.error("Error fetching feature usage:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

// Helper hook to check multiple features at once
export function useMultipleFeatureAccess(featureCodes: string[]) {
  const { data: planFeatures } = usePlanFeatures();
  
  const accessMap: Record<string, boolean> = {};
  
  featureCodes.forEach(code => {
    const planFeature = planFeatures?.find(pf => pf.feature?.code === code);
    accessMap[code] = planFeature?.is_enabled ?? false;
  });

  return {
    accessMap,
    hasAccess: (code: string) => accessMap[code] ?? false,
    isLoading: !planFeatures,
  };
}
