import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole, ROLE_LABEL } from "@/hooks/useAdminRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useAdminSupportNotifier } from "@/hooks/useSupportNotifier";
import { useAdminSupportUnread } from "@/hooks/useSupportChat";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: role } = useAdminRole();
  const navigate = useNavigate();
  useAdminSupportNotifier();
  const { data: unread = 0 } = useAdminSupportUnread();

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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => navigate("/admin/support")}
                aria-label="Support notifications"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center border border-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>
              {user?.email && (
                <div className="text-xs text-muted-foreground truncate max-w-[40vw]">
                  {user.email}
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}


