import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  LifeBuoy,
  RefreshCw,
  Activity,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSupportThreads } from "@/hooks/useSupportChat";

const items = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Workspaces", url: "/admin/workspaces", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Support", url: "/admin/support", icon: LifeBuoy, badge: "support" as const },
  { title: "Sync", url: "/admin/sync", icon: RefreshCw },
  { title: "Audit Log", url: "/admin/audit", icon: Activity },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Unread support badge — uses existing admin hook (RLS-gated to admins).
  const { data: threads = [] } = useAdminSupportThreads("open");
  const openCount = threads.filter((t) => (t.unread_for_admin ?? 0) > 0).length;

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/60 px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-heading font-semibold text-foreground truncate">
                Admin Console
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                GC Navigator
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operations</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url, item.exact);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.exact}
                        className={cn(
                          "flex items-center gap-2 rounded-md",
                          active && "bg-primary/10 text-primary",
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge === "support" && openCount > 0 && (
                              <Badge className="h-5 px-1.5 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">
                                {openCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
              {!collapsed && <span>Back to app</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/admin/login", { replace: true });
              }}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
