import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FileText,
  Heart,
  Sparkles,
  Clock,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useTrackedContracts } from "@/hooks/useTrackedContracts";
import { AIRecommendationsCard } from "@/components/dashboard/AIRecommendationsCard";
import { ProfileHealthCard } from "@/components/dashboard/ProfileHealthCard";

const Dashboard = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: trackedContracts, isLoading: contractsLoading } = useTrackedContracts();

  const userName = profile?.first_name || "there";

  const savedCount = trackedContracts?.filter(c => c.status === "watching").length || 0;
  const inProgressCount = trackedContracts?.filter(c => ["qualifying", "proposal", "submitted"].includes(c.status || "")).length || 0;

  // Find contracts with upcoming deadlines
  const upcomingDeadlines = trackedContracts
    ?.filter(c => c.response_deadline && new Date(c.response_deadline) > new Date())
    .sort((a, b) => new Date(a.response_deadline!).getTime() - new Date(b.response_deadline!).getTime())
    .slice(0, 3) || [];

  const quickActions = [
    { icon: Search, label: "Find Contracts", description: "Search federal & state opportunities", href: "/dashboard/search", color: "text-primary" },
    { icon: Heart, label: "My Opportunities", description: `${savedCount} saved, ${inProgressCount} in progress`, href: "/dashboard/tracked", color: "text-rose-400" },
    { icon: FileText, label: "My Proposals", description: "Create & manage your bids", href: "/dashboard/proposals", color: "text-accent" },
    { icon: Sparkles, label: "Ask AI Helper", description: "Get help with contracts", href: "/dashboard/ai", color: "text-purple-400" },
  ];

  return (
    <DashboardLayout title="Home">
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
            {profileLoading ? (
              <Skeleton className="h-8 w-64 mb-2" />
            ) : (
              <>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Welcome, {userName}! 👋
                </h2>
                <p className="text-muted-foreground mb-4">
                  Find government contracts that fit your business — it's easier than you think.
                </p>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/dashboard/search">
                    <Search className="w-4 h-4 mr-2" />
                    Find Contracts
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link to={action.href}>
                <Card variant="glass-hover" className="cursor-pointer h-full">
                  <CardContent className="p-5">
                    <action.icon className={`w-8 h-8 ${action.color} mb-3`} />
                    <h3 className="font-heading font-semibold text-foreground mb-1">{action.label}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* AI Recommendations + Profile Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIRecommendationsCard />
          <ProfileHealthCard />
        </div>

        {/* Upcoming Deadlines */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contractsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map(contract => {
                  const deadline = new Date(contract.response_deadline!);
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const urgency = daysLeft <= 3 ? "text-destructive" : daysLeft <= 7 ? "text-accent" : "text-success";
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{contract.contract_title}</p>
                        <p className="text-xs text-muted-foreground">{contract.contract_agency}</p>
                      </div>
                      <span className={`text-sm font-semibold whitespace-nowrap ml-3 ${urgency}`}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming deadlines yet.</p>
                <p className="text-xs">Save contracts to track their deadlines here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Getting Started Tips */}
        {(!trackedContracts || trackedContracts.length === 0) && (
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Search for contracts in your industry", link: "/dashboard/search" },
                  { step: "2", text: "Save the ones that interest you", link: "/dashboard/tracked" },
                  { step: "3", text: "Use AI to help write your proposal", link: "/dashboard/ai" },
                ].map(tip => (
                  <Link key={tip.step} to={tip.link} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {tip.step}
                    </div>
                    <span className="text-sm text-foreground flex-1">{tip.text}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
