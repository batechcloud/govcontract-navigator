import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FileText,
  Building2,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { useProfile } from "@/hooks/useProfile";
import { useTrackedContracts } from "@/hooks/useTrackedContracts";

const Dashboard = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: trackedContracts, isLoading: contractsLoading } = useTrackedContracts();

  const userName = profile?.first_name || "there";
  
  // Calculate stats from tracked contracts
  const activeContracts = trackedContracts?.filter(c => c.status !== "won" && c.status !== "lost") || [];
  const proposalsInProgress = trackedContracts?.filter(c => c.status === "proposal" || c.status === "submitted") || [];
  const totalValue = trackedContracts?.reduce((sum, c) => {
    const value = c.contract_value?.replace(/[^0-9.]/g, "") || "0";
    return sum + parseFloat(value);
  }, 0) || 0;

  const stats = [
    { label: "Active Opportunities", value: activeContracts.length.toString() },
    { label: "Proposals in Progress", value: proposalsInProgress.length.toString() },
    { label: "Tracked Contracts", value: (trackedContracts?.length || 0).toString() },
    { label: "Pipeline Value", value: `$${(totalValue / 1000000).toFixed(1)}M` },
  ];

  const pipelineStages = [
    { stage: "Watching", count: trackedContracts?.filter(c => c.status === "watching").length || 0, color: "bg-blue-500" },
    { stage: "Qualifying", count: trackedContracts?.filter(c => c.status === "qualifying").length || 0, color: "bg-yellow-500" },
    { stage: "Proposal", count: trackedContracts?.filter(c => c.status === "proposal").length || 0, color: "bg-purple-500" },
    { stage: "Submitted", count: trackedContracts?.filter(c => c.status === "submitted").length || 0, color: "bg-green-500" },
  ];

  // Get top 3 contracts by match score
  const topMatches = [...(trackedContracts || [])]
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    .slice(0, 3);

  return (
    <DashboardLayout title="Dashboard">
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
                {profileLoading ? (
                  <>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-48" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
                      Welcome back, {userName}! 👋
                    </h2>
                    <p className="text-muted-foreground">
                      {trackedContracts?.length ? (
                        <>You have <span className="text-accent font-semibold">{activeContracts.length} active opportunities</span> in your pipeline.</>
                      ) : (
                        <>Start tracking contracts to build your pipeline.</>
                      )}
                    </p>
                  </>
                )}
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
            <StatsCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              loading={contractsLoading}
            />
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
                  <Link to="/dashboard/tracked">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {contractsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : topMatches.length > 0 ? (
                  topMatches.map((contract) => (
                    <OpportunityCard key={contract.id} contract={contract} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tracked contracts yet.</p>
                    <p className="text-sm">Search for contracts to start tracking opportunities.</p>
                  </div>
                )}
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
                  {pipelineStages.map((item) => (
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
    </DashboardLayout>
  );
};

export default Dashboard;
