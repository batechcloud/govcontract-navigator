import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  LayoutDashboard,
  FileText,
  Kanban,
  Building2,
  Bell,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  FolderOpen,
  Target,
  TrendingUp,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Search, label: "Search Hub", href: "/dashboard/search" },
  { icon: Target, label: "Tracked Contracts", href: "/dashboard/tracked" },
  { icon: Kanban, label: "Journey Hub", href: "/dashboard/journey" },
  { icon: FileText, label: "Proposals", href: "/dashboard/proposals" },
  { icon: Building2, label: "Company Profile", href: "/dashboard/company" },
  { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/ai" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: FolderOpen, label: "Documents", href: "/dashboard/documents" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
  { icon: Users, label: "Teaming", href: "/dashboard/teaming" },
  { icon: TrendingUp, label: "Market Watch", href: "/dashboard/market" },
];

const recentOpportunities = [
  {
    id: 1,
    title: "IT Support Services - DOD",
    agency: "Department of Defense",
    value: "$2.5M",
    deadline: "Dec 28, 2025",
    match: 94,
  },
  {
    id: 2,
    title: "Cybersecurity Assessment",
    agency: "DHS",
    value: "$850K",
    deadline: "Jan 5, 2026",
    match: 89,
  },
  {
    id: 3,
    title: "Cloud Migration Services",
    agency: "GSA",
    value: "$1.2M",
    deadline: "Jan 12, 2026",
    match: 87,
  },
];

const stats = [
  { label: "Active Opportunities", value: "24", change: "+3" },
  { label: "Proposals in Progress", value: "5", change: "+1" },
  { label: "Win Rate", value: "34%", change: "+8%" },
  { label: "Pipeline Value", value: "$12.4M", change: "+$2.1M" },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-heading font-semibold text-sm">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john@company.com</p>
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
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">
                  <LogOut className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </aside>

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
              <h1 className="font-heading font-semibold text-lg text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contracts..."
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Welcome Banner */}
            <Card variant="glass" className="overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
                      Welcome back, John! 👋
                    </h2>
                    <p className="text-muted-foreground">
                      You have <span className="text-accent font-semibold">3 new opportunities</span> matching your profile today.
                    </p>
                  </div>
                  <Button variant="hero" asChild>
                    <Link to="/dashboard/search">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Find Contracts
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} variant="glass-hover">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-heading font-bold text-foreground">
                        {stat.value}
                      </span>
                      <Badge variant="success" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Opportunities */}
              <div className="lg:col-span-2">
                <Card variant="glass">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Top Matched Opportunities</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/search">
                        View All
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentOpportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-semibold text-foreground mb-1 truncate">
                            {opp.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">{opp.agency}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-accent font-semibold">{opp.value}</span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {opp.deadline}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Badge variant="success">{opp.match}% Match</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/dashboard/search">
                        <Search className="w-4 h-4 mr-3" />
                        Search Contracts
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/dashboard/proposals/new">
                        <FileText className="w-4 h-4 mr-3" />
                        Generate Proposal
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/dashboard/ai">
                        <MessageSquare className="w-4 h-4 mr-3" />
                        Ask AI Assistant
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/dashboard/company">
                        <Building2 className="w-4 h-4 mr-3" />
                        Update Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Pipeline Summary */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pipeline Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { stage: "Discovery", count: 12, color: "bg-blue-500" },
                        { stage: "Qualifying", count: 8, color: "bg-yellow-500" },
                        { stage: "Proposal", count: 5, color: "bg-purple-500" },
                        { stage: "Submitted", count: 3, color: "bg-green-500" },
                      ].map((item) => (
                        <div key={item.stage} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="flex-1 text-sm text-muted-foreground">{item.stage}</span>
                          <span className="font-heading font-semibold text-foreground">{item.count}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="glass" size="sm" className="w-full mt-4" asChild>
                      <Link to="/dashboard/journey">
                        View Pipeline
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-40">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
              { icon: Search, label: "Search", href: "/dashboard/search" },
              { icon: Kanban, label: "Pipeline", href: "/dashboard/journey" },
              { icon: FileText, label: "Proposals", href: "/dashboard/proposals" },
              { icon: Settings, label: "Settings", href: "/dashboard/settings" },
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
    </div>
  );
};

export default Dashboard;
