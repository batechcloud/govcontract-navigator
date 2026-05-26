import { useAdminRole } from "./useAdminRole";

/**
 * Backwards-compatible wrapper. Returns true for any admin-tier role
 * (superadmin / workspace_admin / subscription_manager). Use useAdminRole()
 * directly when you need to discriminate between tiers.
 */
export function useIsAdmin() {
  const q = useAdminRole();
  return { ...q, data: q.data ? true : false };
}
