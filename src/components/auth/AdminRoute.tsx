import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole, AdminRole } from "@/hooks/useAdminRole";
import { isImpersonating } from "@/lib/impersonation";

/**
 * Guards admin-only routes. Optionally accepts allowedRoles to restrict
 * which admin tiers can access. Superadmin ('admin') always passes.
 */
export const AdminRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  /** If omitted, any admin-tier role is allowed. */
  allowedRoles?: Exclude<AdminRole, null>[];
}) => {
  const { user, loading } = useAuth();
  const { data: role, isLoading: checking } = useAdminRole();

  if (isImpersonating()) return <Navigate to="/dashboard" replace />;

  if (loading || (user && checking)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !role) return <Navigate to="/admin/login" replace />;

  if (allowedRoles && role !== "admin" && !allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
