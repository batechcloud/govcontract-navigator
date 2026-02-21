import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatPercent, CHART_COLORS } from "@/lib/usaspending-utils";
import { useSpendingByCategory } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  fy: string;
  refreshKey: number;
}

export const SpendingByCategory = ({ fy, refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useSpendingByCategory(fy, refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load category data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const total = data?.reduce((sum, c) => sum + c.amount, 0) || 0;

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Spending by Category</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatDollars(value), "Obligated"]}
                  contentStyle={{ background: "hsl(228,45%,14%)", border: "1px solid hsl(228,35%,28%)", borderRadius: 8, color: "#fff" }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">No data available</p>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3"><Skeleton className="h-5 w-32" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-10" /></td>
                      </tr>
                    ))
                  : data?.map((cat, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-foreground">{cat.name}</span>
                        </td>
                        <td className="p-3 text-right text-foreground">{formatDollars(cat.amount)}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {total > 0 ? formatPercent((cat.amount / total) * 100) : "0%"}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
