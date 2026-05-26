import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isImpersonating } from "@/lib/impersonation";

/**
 * Single source of truth for admin checks.
 * Returns false while impersonating a workspace owner so admin UI never
 * leaks into the target's view.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      if (isImpersonating()) return false;
      const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (error) {
        console.error("is_admin check failed", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
