import { Skeleton } from "@/components/ui/skeleton";
import { abbreviateNumber } from "@/lib/usaspending-utils";
import { useSpendingTrends } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  refreshKey: number;
}

export const SpendingTrends = ({ refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useSpendingTrends(refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load trend data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const first = data?.[0];
  const last = data?.[data.length - 1];
  const growth = first && last && first.totalContracts > 0
    ? (((last.totalContracts - first.totalContracts) / first.totalContracts) * 100).toFixed(1)
    : null;

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Spending Trends Over Time</h3>
      <div className="bg-card border border-border rounded-lg p-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data && data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(228,61%,55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(228,61%,55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145,63%,49%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145,63%,49%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228,35%,20%)" />
                <XAxis dataKey="year" tick={{ fill: "hsl(215,25%,70%)", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => abbreviateNumber(v)} tick={{ fill: "hsl(215,25%,70%)", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === "totalContracts" ? "Total Contracts" : "SB Contracts",
                  ]}
                  contentStyle={{ background: "hsl(228,45%,14%)", border: "1px solid hsl(228,35%,28%)", borderRadius: 8, color: "#fff" }}
                />
                <Area type="monotone" dataKey="totalContracts" stroke="hsl(228,61%,55%)" fill="url(#colorTotal)" strokeWidth={2} dot={{ r: 4 }} />
                <Area type="monotone" dataKey="sbContracts" stroke="hsl(145,63%,49%)" fill="url(#colorSB)" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
            {growth && (
              <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground">
                📊 Federal contracting volume changed <strong>{growth}%</strong> from {first?.year} to {last?.year}.
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-12">No trend data available</p>
        )}
      </div>
    </div>
  );
};
