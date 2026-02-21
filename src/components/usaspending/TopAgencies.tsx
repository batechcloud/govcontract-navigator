import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatPercent, CHART_COLORS } from "@/lib/usaspending-utils";
import { useTopAgencies } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

interface Props {
  fy: string;
  refreshKey: number;
  onAgencySelect: (agency: string) => void;
}

const rankBadge = (rank: number) => {
  if (rank === 1) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">🥇</Badge>;
  if (rank === 2) return <Badge className="bg-slate-400/20 text-slate-300 border-slate-400/30">🥈</Badge>;
  if (rank === 3) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">🥉</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">{rank}</Badge>;
};

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

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Top Spending Agencies</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Agency</th>
                  <th className="text-right p-3">Obligated</th>
                  <th className="text-right p-3">%</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-40" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-10" /></td>
                      </tr>
                    ))
                  : data?.map((agency) => (
                      <tr
                        key={agency.rank}
                        className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                        onClick={() => onAgencySelect(agency.name)}
                      >
                        <td className="p-3">{rankBadge(agency.rank)}</td>
                        <td className="p-3 text-foreground font-medium max-w-[200px] truncate">{agency.name}</td>
                        <td className="p-3 text-right text-foreground">{formatDollars(agency.amount)}</td>
                        <td className="p-3 text-right text-muted-foreground">{formatPercent(agency.percentage)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => formatDollars(v)} tick={{ fill: "hsl(215,25%,70%)", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(215,25%,70%)", fontSize: 11 }}
                  tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                />
                <Tooltip
                  formatter={(value: number) => [formatDollars(value), "Obligated"]}
                  contentStyle={{ background: "hsl(228,45%,14%)", border: "1px solid hsl(228,35%,28%)", borderRadius: 8, color: "#fff" }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};
