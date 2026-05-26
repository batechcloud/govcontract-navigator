import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { isImpersonating } from "@/lib/impersonation";

/**
 * Guards admin-only routes. Single server-side check via is_admin() RPC.
 * Non-admins (including unauthenticated users) are sent to /admin/login.
 * While impersonating a workspace owner, admin pages are not accessible.
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();

  if (isImpersonating()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading || (user && checking)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
