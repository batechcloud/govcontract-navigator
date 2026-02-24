import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Lightbulb, Target, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ContractScoreResult } from "@/hooks/useWinProbability";

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "text-success" : score >= 40 ? "text-accent" : "text-destructive";

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className={color}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">Win %</span>
      </div>
    </div>
  );
}

const recColors = {
  Bid: "bg-success/20 text-success",
  "No-Bid": "bg-destructive/20 text-destructive",
  Consider: "bg-accent/20 text-accent",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractTitle: string;
  result: ContractScoreResult | null;
  isLoading: boolean;
}

export function WinScoreModal({ open, onOpenChange, contractTitle, result, isLoading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base font-heading leading-snug pr-6">
            <Target className="w-4 h-4 inline mr-2 text-primary" />
            Win Analysis
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{contractTitle}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="w-28 h-28 rounded-full mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : result ? (
          <div className="space-y-4 py-2">
            <ScoreRing score={result.score} />

            <div className="text-center">
              <Badge className={`${recColors[result.recommendation]} text-sm px-3 py-1`}>
                {result.recommendation}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground text-center">{result.reasoning}</p>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-success" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-success">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent" /> Gaps
                </h4>
                <ul className="space-y-1">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-accent">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" /> Tips
                </h4>
                <ul className="space-y-1">
                  {result.tips.map((t, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
