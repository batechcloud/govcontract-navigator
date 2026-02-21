import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars } from "@/lib/usaspending-utils";
import { useGeographicSpending } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  fy: string;
  refreshKey: number;
}

export const GeographicSpending = ({ fy, refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useGeographicSpending(fy, refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load geographic data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const maxAmount = data?.[0]?.amount || 1;

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Geographic Spending</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-right p-3">Total Obligated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3"><Skeleton className="h-5 w-6" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                      </tr>
                    ))
                  : data?.map((state) => (
                      <tr key={state.rank} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="p-3 text-muted-foreground">{state.rank}</td>
                        <td className="p-3 text-foreground font-medium">{state.state}</td>
                        <td className="p-3 text-right text-foreground">{formatDollars(state.amount)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Cards */}
        <div className="grid grid-cols-3 gap-3">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            : data?.slice(0, 9).map((state) => {
                const intensity = Math.max(20, Math.min(80, (state.amount / maxAmount) * 80));
                return (
                  <div
                    key={state.code}
                    className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors"
                    style={{ background: `hsl(228, 61%, ${8 + intensity * 0.15}%)` }}
                  >
                    <p className="text-2xl font-bold text-foreground">{state.code}</p>
                    <p className="text-sm font-medium text-primary mt-1">{formatDollars(state.amount)}</p>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
