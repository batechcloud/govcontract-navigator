import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatPercent } from "@/lib/usaspending-utils";
import { useTopAgencies } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Building2 } from "lucide-react";

interface Props {
  fy: string;
  refreshKey: number;
  onAgencySelect: (agency: string) => void;
}

export const TopAgencies = ({ fy, refreshKey, onAgencySelect }: Props) => {
  const { data, isLoading, isError, refetch } = useTopAgencies(fy, refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load agency data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const max = data?.length ? Math.max(...data.map((a) => a.amount)) : 0;

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Who spends the most</h3>
        <p className="text-sm text-muted-foreground">
          The agencies awarding the most contract dollars in {fy}. Click one to see its awards.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border/60">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          : data && data.length > 0
          ? data.map((agency) => (
              <button
                key={agency.rank}
                type="button"
                onClick={() => onAgencySelect(agency.name)}
                className="w-full text-left p-4 hover:bg-primary/5 transition-colors group"
                aria-label={`View awards from ${agency.name}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                    {agency.rank}
                  </span>
                  <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground font-medium">{agency.name}</span>
                  <span className="shrink-0 text-foreground font-semibold tabular-nums">
                    {formatDollars(agency.amount)}
                  </span>
                  <span className="shrink-0 w-14 text-right text-xs text-muted-foreground tabular-nums">
                    {formatPercent(agency.percentage)}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-2 ml-9 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${max > 0 ? (agency.amount / max) * 100 : 0}%` }}
                  />
                </div>
              </button>
            ))
          : (
            <p className="text-muted-foreground text-center py-12 text-sm">
              No agency spending recorded for {fy} yet.
            </p>
          )}
      </div>
    </section>
  );
};
