import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Single source of truth for admin checks.
 * Calls the server-side `is_admin(uuid)` SQL function which reads from
 * the `admin_emails` allowlist (synced from the ADMIN_EMAILS secret).
 * No client-side role tables, no manual inserts.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
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
