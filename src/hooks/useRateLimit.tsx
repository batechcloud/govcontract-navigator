import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const DAILY_LIMIT = 50;

export function useSearchRateLimit() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return useQuery({
    queryKey: ["rate-limit", "sam_search", user?.id, today],
    queryFn: async () => {
      if (!user) return { used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };

      // Query the api_rate_limits table (not in generated types yet, use type assertion)
      const { data, error } = await (supabase as any)
        .from("api_rate_limits")
        .select("request_count")
        .eq("user_id", user.id)
        .eq("api_name", "sam_search")
        .eq("request_date", today)
        .maybeSingle();

      if (error) {
        console.error("Rate limit fetch error:", error);
        return { used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
      }

      const used = data?.request_count ?? 0;
      return {
        used,
        remaining: Math.max(0, DAILY_LIMIT - used),
        limit: DAILY_LIMIT,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Refresh every 30s
    refetchOnWindowFocus: true,
  });
}
