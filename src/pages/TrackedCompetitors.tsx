import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  DollarSign,
  Trash2,
  ExternalLink,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackedCompetitors, useUntrackCompetitor } from "@/hooks/useCompetitorIntelligence";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const TrackedCompetitors = () => {
  const { data: competitors, isLoading } = useTrackedCompetitors();
  const untrackCompetitor = useUntrackCompetitor();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const totalCompetitorValue = competitors?.reduce((sum, c) => sum + (c.total_value || 0), 0) || 0;
  const totalCompetitorAwards = competitors?.reduce((sum, c) => sum + (c.total_awards || 0), 0) || 0;

  return (
    <DashboardLayout title="Tracked Competitors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Competitors Tracked</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-8" /> : competitors?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Awards</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : totalCompetitorAwards}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Combined Value</p>
              <p className="text-2xl font-heading font-bold text-accent">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalCompetitorValue)}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg per Competitor</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : competitors?.length ? (
                  formatCurrency(totalCompetitorValue / competitors.length)
                ) : (
                  "$0"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Competitors List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !competitors?.length ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Competitors Tracked</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Search for competitors and start tracking their federal contract wins.
              </p>
              <Button variant="hero" asChild>
                <Link to="/dashboard/analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Find Competitors
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {competitors.map((competitor) => (
              <Card key={competitor.id} variant="glass-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            {competitor.competitor_name}
                          </h3>
                          {competitor.competitor_uei && (
                            <p className="text-xs text-muted-foreground">
                              UEI: {competitor.competitor_uei}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {competitor.total_awards} awards
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-accent">
                            {formatCurrency(competitor.total_value || 0)}
                          </span>
                        </div>
                        {competitor.last_synced_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Synced {format(new Date(competitor.last_synced_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>

                      {competitor.naics_codes?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {competitor.naics_codes.slice(0, 5).map((code) => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                          {competitor.naics_codes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{competitor.naics_codes.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://www.usaspending.gov/search/?hash=recipient_name_${encodeURIComponent(competitor.competitor_name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Awards
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => untrackCompetitor.mutate(competitor.id)}
                        disabled={untrackCompetitor.isPending}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TrackedCompetitors;
