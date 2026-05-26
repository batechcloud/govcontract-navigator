import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isImpersonating } from "@/lib/impersonation";

export type AdminRole = "admin" | "subscription_manager" | "workspace_admin" | null;

/**
 * Returns the highest-priority admin role for the current user.
 * Priority: admin (superadmin) > workspace_admin > subscription_manager.
 * Returns null while impersonating, or if no admin-tier role exists.
 */
export function useAdminRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AdminRole> => {
      if (!user || isImpersonating()) return null;
      // Superadmin (also covers legacy admin_emails grant)
      const { data: isSuper } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (isSuper) return "admin";
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const set = new Set((roles ?? []).map((r) => r.role as string));
      if (set.has("workspace_admin")) return "workspace_admin";
      if (set.has("subscription_manager")) return "subscription_manager";
      return null;
    },
  });
}

export const ROLE_LABEL: Record<Exclude<AdminRole, null>, string> = {
  admin: "Superadmin",
  workspace_admin: "Workspace Admin",
  subscription_manager: "Subscription Manager",
};
