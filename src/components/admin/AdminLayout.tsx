import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole, ROLE_LABEL } from "@/hooks/useAdminRole";
import { Badge } from "@/components/ui/badge";
import { useAdminSupportNotifier } from "@/hooks/useSupportNotifier";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: role } = useAdminRole();
  useAdminSupportNotifier();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border/60 px-3 sticky top-0 z-30 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {role && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {ROLE_LABEL[role]}
                </Badge>
              )}
            </div>
            {user?.email && (
              <div className="text-xs text-muted-foreground truncate max-w-[40vw]">
                {user.email}
              </div>
            )}
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

