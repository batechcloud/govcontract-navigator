import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, Clock, Building2, RefreshCw, Search, Lightbulb } from "lucide-react";
import { useAIRecommendations, AIRecommendation } from "@/hooks/useAIRecommendations";

const priorityColors = {
  high: "bg-success/20 text-success",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

export function AIRecommendationsCard() {
  const { data, isLoading, isError, refetch, isFetching } = useAIRecommendations();

  if (isError) return null;

  const recs = data?.recommendations || [];

  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Picks For You
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 text-xs gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : data?.message && recs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{data.message}</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/dashboard/company">Complete Profile</Link>
            </Button>
          </div>
        ) : recs.length > 0 ? (
          <div className="space-y-3">
            {recs.slice(0, 5).map((rec: AIRecommendation) => (
              <Link
                key={rec.id}
                to={`/dashboard/search?q=${encodeURIComponent(rec.title)}`}
                className="block p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {rec.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {rec.agency}
                    </p>
                    <p className="text-xs text-accent mt-1 italic">{rec.match_reason}</p>
                  </div>
                  <Badge className={`${priorityColors[rec.priority]} text-[10px] shrink-0`}>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{rec.value}</span>
                  {rec.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rec.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No recommendations right now.</p>
            <p className="text-xs">Check back later for personalized picks.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
