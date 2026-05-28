import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ArrowRight, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAIProfileScore } from "@/hooks/useAIProfileScore";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useMemo } from "react";
import { computeHeuristicProfileScore } from "@/lib/heuristic-profile-score";

const priorityIcons = {
  high: <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />,
  medium: <AlertTriangle className="w-3.5 h-3.5 text-accent shrink-0" />,
  low: <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />,
};

const ScoreRing = forwardRef<HTMLDivElement, { score: number }>(({ score }, ref) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "text-success" : score >= 40 ? "text-accent" : "text-destructive";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div ref={ref} className="relative w-24 h-24 shrink-0 cursor-help">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
              <circle
                cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className={color}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${color}`}>{score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
            <Info className="w-3 h-3 text-muted-foreground absolute top-0 right-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-xs space-y-1 p-3">
          <p className="font-semibold text-foreground">How is this scored?</p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• <strong>SAM UEI / CAGE:</strong> registration completeness</li>
            <li>• <strong>NAICS & PSC codes:</strong> targeting breadth</li>
            <li>• <strong>Certifications:</strong> set-aside eligibility</li>
            <li>• <strong>Capabilities:</strong> profile depth</li>
            <li>• <strong>Past performance:</strong> win history</li>
          </ul>
          <p className="text-muted-foreground pt-1">AI-analyzed against federal readiness best practices.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
ScoreRing.displayName = "ScoreRing";
export function ProfileHealthCard() {
  const { data: aiData, isLoading, isError, isFetching } = useAIProfileScore();
  const { data: companyProfile } = useCompanyProfile();

  const heuristic = useMemo(
    () => computeHeuristicProfileScore(companyProfile),
    [companyProfile]
  );

  // Prefer AI result once available; otherwise show heuristic instantly.
  const data = aiData ?? heuristic;
  const showSkeleton = isLoading && !companyProfile;

  if (isError && !companyProfile) return null;
  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Profile Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showSkeleton ? (
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : data ? (
          <div className="flex gap-4 items-start">
            <ScoreRing score={data.score} />
            <div className="flex-1 min-w-0 space-y-2">
              {data.summary && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {data.summary}
                  {!aiData && isFetching && (
                    <span className="text-[10px] text-muted-foreground/60">· refining…</span>
                  )}
                </p>
              )}
              {data.suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  {priorityIcons[s.priority]}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs" asChild>
                <Link to="/dashboard/company">
                  Improve Profile <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
