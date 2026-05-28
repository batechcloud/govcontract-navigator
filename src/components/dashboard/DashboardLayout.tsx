import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  LayoutDashboard,
  FileText,
  Heart,
  Sparkles,
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  BarChart3,
} from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTrackActivity } from "@/hooks/useTrackActivity";
import { useWorkspaceSupportNotifier } from "@/hooks/useSupportNotifier";
import { useSupportUnreadCount } from "@/hooks/useSupportChat";
import { SupportChatPanel } from "@/components/support/SupportChatPanel";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  useTrackActivity();
  useWorkspaceSupportNotifier(() => setSupportOpen(true));
  const { data: unread = 0 } = useSupportUnreadCount();

  const initials = profile
    ? `${(profile.first_name?.[0] || "").toUpperCase()}${(profile.last_name?.[0] || "").toUpperCase()}` || "U"
    : user?.email?.[0]?.toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-heading font-semibold text-lg text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contracts..."
                  className="pl-9 w-64"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && headerSearch.trim()) {
                      navigate(`/dashboard/search?q=${encodeURIComponent(headerSearch.trim())}`);
                      setHeaderSearch("");
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setSupportOpen(true)}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center border border-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>


              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : user?.email || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard/company")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-40">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
              { icon: Search, label: "Find", href: "/dashboard/search" },
              { icon: Heart, label: "Saved", href: "/dashboard/tracked" },
              { icon: FileText, label: "Proposals", href: "/dashboard/proposals" },
              { icon: Sparkles, label: "AI Help", href: "/dashboard/ai" },
              { icon: BarChart3, label: "Intel", href: "/dashboard/usaspending" },
            ].map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <SupportChatPanel open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
};
