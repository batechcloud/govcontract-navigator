import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars } from "@/lib/usaspending-utils";
import { useTopRecipients } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  fy: string;
  refreshKey: number;
}

export const TopRecipients = ({ fy, refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useTopRecipients(fy, refreshKey);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load recipient data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const maxAmount = data?.[0]?.total || 1;

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Top Recipients</h3>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 w-8"></th>
                <th className="text-left p-3">Rank</th>
                <th className="text-left p-3">Recipient</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3 hidden sm:table-cell"># Awards</th>
                <th className="text-right p-3 hidden md:table-cell">Avg Award</th>
                <th className="p-3 hidden lg:table-cell">Share</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : data?.map((recipient) => (
                    <tr key={recipient.rank}>
                      <td colSpan={7} className="p-0">
                        <div
                          className="flex items-center p-3 hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/50"
                          onClick={() => setExpanded(expanded === recipient.rank ? null : recipient.rank)}
                        >
                          <div className="w-8">
                            {expanded === recipient.rank ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="w-12">
                            {recipient.rank <= 3 ? (
                              <Badge className={recipient.rank === 1 ? "bg-amber-500/20 text-amber-400" : recipient.rank === 2 ? "bg-slate-400/20 text-slate-300" : "bg-orange-600/20 text-orange-400"}>
                                {recipient.rank === 1 ? "🥇" : recipient.rank === 2 ? "🥈" : "🥉"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{recipient.rank}</span>
                            )}
                          </div>
                          <div className="flex-1 text-foreground font-medium truncate">{recipient.name}</div>
                          <div className="text-right text-foreground font-medium w-24">{formatDollars(recipient.total)}</div>
                          <div className="text-right text-muted-foreground w-16 hidden sm:block">{recipient.count}</div>
                          <div className="text-right text-muted-foreground w-24 hidden md:block">{formatDollars(recipient.avg)}</div>
                          <div className="w-32 hidden lg:block px-2">
                            <Progress value={(recipient.total / maxAmount) * 100} className="h-2" />
                          </div>
                        </div>
                        {expanded === recipient.rank && (
                          <div className="bg-muted/30 p-4 border-b border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Individual Awards:</p>
                            <div className="space-y-1">
                              {recipient.awards.slice(0, 5).map((a: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-foreground truncate max-w-[200px]">{a["awarding_agency_name"] || "—"}</span>
                                  <span className="text-foreground">{formatDollars(a["Award Amount"] || 0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
