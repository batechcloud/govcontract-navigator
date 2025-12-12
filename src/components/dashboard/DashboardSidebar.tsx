import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  LayoutDashboard,
  FileText,
  Kanban,
  Building2,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  FolderOpen,
  Target,
  TrendingUp,
  X,
  LogOut,
  ChevronDown,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useMultipleFeatureAccess } from "@/hooks/useFeatureAccess";
import { cn } from "@/lib/utils";

// Map sidebar items to feature codes
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", featureCode: "dashboard" },
  { icon: Search, label: "Search Hub", href: "/dashboard/search", featureCode: "search_federal" },
  { icon: Target, label: "Tracked Contracts", href: "/dashboard/tracked", featureCode: "tracking" },
  { icon: Kanban, label: "Journey Hub", href: "/dashboard/journey", featureCode: "tracking" },
  { icon: FileText, label: "Proposals", href: "/dashboard/proposals", featureCode: "proposal_editor" },
  { icon: Building2, label: "Company Profile", href: "/dashboard/company", featureCode: "dashboard" },
  { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/ai", featureCode: "ai_chat" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", featureCode: "competitor_analysis" },
  { icon: FolderOpen, label: "Documents", href: "/dashboard/documents", featureCode: "documents" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar", featureCode: "calendar" },
  { icon: Users, label: "Teaming", href: "/dashboard/teaming", featureCode: "teaming_partners" },
  { icon: TrendingUp, label: "Market Watch", href: "/dashboard/market", featureCode: "market_watch" },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  
  // Get all feature codes and check access
  const featureCodes = sidebarItems.map(item => item.featureCode);
  const { accessMap, isLoading: accessLoading } = useMultipleFeatureAccess(featureCodes);

  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : "User";

  const userEmail = user?.email || "";
  const planName = subscription?.plan?.display_name || "Starter";

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold">G</span>
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              Gov<span className="gradient-text-gold">AI</span>
            </span>
          </Link>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Badge */}
        <div className="px-4 py-2 border-b border-border">
          <Link to="/pricing" className="flex items-center gap-2 group">
            <Badge 
              variant={planName === "Enterprise" ? "gold" : planName === "Professional" ? "default" : "secondary"}
              className="text-xs"
            >
              {planName}
            </Badge>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              {planName === "Starter" && (
                <>
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Upgrade
                </>
              )}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              const hasAccess = accessLoading || accessMap[item.featureCode];
              
              return (
                <li key={item.label}>
                  {hasAccess ? (
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      to="/pricing"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        "text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 cursor-pointer"
                      )}
                      title={`Upgrade to unlock ${item.label}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      <Lock className="w-3 h-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-heading font-semibold text-sm">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" asChild>
              <Link to="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
