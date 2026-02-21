import { Building2, PieChart, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmallBusinessData } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  fy: string;
  refreshKey: number;
}

export const SmallBusinessIntel = ({ fy, refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useSmallBusinessData(fy, refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load small business data</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const totalSB = data?.reduce((sum, d) => sum + d.count, 0) || 0;
  const topType = data?.reduce((a, b) => (b.count > a.count ? b : a), { label: "—", count: 0 });

  const cards = [
    { icon: Building2, label: "Total SB Awards", value: totalSB.toLocaleString(), color: "text-primary" },
    { icon: PieChart, label: "Most Common Type", value: topType?.label || "—", color: "text-accent" },
    { icon: Trophy, label: "Top Type Count", value: (topType?.count || 0).toLocaleString(), color: "text-emerald-400" },
    { icon: TrendingUp, label: "Set-Aside Categories", value: data?.filter(d => d.count > 0).length.toString() || "0", color: "text-amber-400" },
  ];

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Small Business Intelligence</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3">Set-Aside Type</th>
                <th className="text-right p-3"># Awards</th>
                <th className="text-right p-3">% of SB Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-10" /></td>
                    </tr>
                  ))
                : data?.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="p-3 text-foreground">{row.label}</td>
                      <td className="p-3 text-right text-foreground">{row.count.toLocaleString()}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {totalSB > 0 ? ((row.count / totalSB) * 100).toFixed(1) + "%" : "0%"}
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
