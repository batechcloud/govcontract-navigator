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
  Filter,
  SlidersHorizontal,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Bookmark,
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

const searchResults = [
  {
    id: 1,
    title: "IT Infrastructure Modernization Support",
    agency: "Department of Defense",
    type: "Federal",
    setAside: "SDVOSB",
    value: "$4.2M",
    deadline: "Jan 15, 2026",
    posted: "Dec 10, 2025",
    match: 96,
    naics: "541512",
    location: "Washington, DC",
  },
  {
    id: 2,
    title: "Cybersecurity Risk Assessment Services",
    agency: "Department of Homeland Security",
    type: "Federal",
    setAside: "8(a)",
    value: "$1.8M",
    deadline: "Jan 22, 2026",
    posted: "Dec 8, 2025",
    match: 92,
    naics: "541519",
    location: "Arlington, VA",
  },
  {
    id: 3,
    title: "Cloud Migration and Management",
    agency: "General Services Administration",
    type: "Federal",
    setAside: "Small Business",
    value: "$2.5M",
    deadline: "Feb 1, 2026",
    posted: "Dec 5, 2025",
    match: 88,
    naics: "541511",
    location: "Remote",
  },
  {
    id: 4,
    title: "Data Analytics Platform Development",
    agency: "Department of Veterans Affairs",
    type: "Federal",
    setAside: "WOSB",
    value: "$3.1M",
    deadline: "Feb 10, 2026",
    posted: "Dec 3, 2025",
    match: 85,
    naics: "541512",
    location: "Multiple Locations",
  },
  {
    id: 5,
    title: "Network Security Operations Center",
    agency: "Department of Energy",
    type: "Federal",
    setAside: "HUBZone",
    value: "$5.7M",
    deadline: "Feb 28, 2026",
    posted: "Dec 1, 2025",
    match: 82,
    naics: "541519",
    location: "Oak Ridge, TN",
  },
];

const SearchHub = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
              <h1 className="font-heading font-semibold text-lg text-foreground">Search Hub</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-24 lg:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* AI Search Bar */}
            <Card variant="glass" className="overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="font-heading font-semibold text-foreground">AI-Powered Search</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Try: 'IT contracts over $1M for small businesses in cybersecurity'"
                      className="pl-12 h-12 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-12">
                      <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Filters</span>
                    </Button>
                    <Button variant="hero" className="h-12">
                      <Search className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Search</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Ask in natural language. Our AI understands set-asides, NAICS codes, agencies, and more.
                </p>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {["Federal", "State", "Grants", "SDVOSB", "8(a)", "HUBZone", "WOSB"].map((filter) => (
                <Badge
                  key={filter}
                  variant="glass"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {filter}
                </Badge>
              ))}
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-semibold">5</span> opportunities sorted by match score
                </p>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>

              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card variant="glass-hover" className="cursor-pointer">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Match Score */}
                          <div className="flex lg:flex-col items-center gap-3 lg:gap-1">
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-heading font-bold ${
                                result.match >= 90
                                  ? "bg-success/20 text-success"
                                  : result.match >= 80
                                  ? "bg-primary/20 text-primary"
                                  : "bg-accent/20 text-accent"
                              }`}
                            >
                              {result.match}%
                            </div>
                            <span className="text-xs text-muted-foreground">Match</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">{result.type}</Badge>
                              <Badge variant="gold">{result.setAside}</Badge>
                              <Badge variant="glass">{result.naics}</Badge>
                            </div>
                            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                              {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{result.agency}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-1 text-accent">
                                <DollarSign className="w-4 h-4" />
                                {result.value}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                Due: {result.deadline}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {result.location}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex lg:flex-col gap-2">
                            <Button variant="hero" size="sm">
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Proposal
                            </Button>
                            <Button variant="outline" size="sm">
                              <Bookmark className="w-4 h-4 mr-2" />
                              Track
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
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

export default SearchHub;
