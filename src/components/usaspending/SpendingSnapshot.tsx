import { DollarSign, FileText, Building2, Trophy, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatPercent } from "@/lib/usaspending-utils";
import { useSpendingSnapshot } from "@/hooks/useUSASpending";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  fy: string;
  refreshKey: number;
}

export const SpendingSnapshot = ({ fy, refreshKey }: Props) => {
  const { data, isLoading, isError, refetch } = useSpendingSnapshot(fy, refreshKey);

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load spending snapshot</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const cards = [
    { icon: DollarSign, label: "Total Federal Spending", value: data ? formatDollars(data.totalSpending) : "-", color: "text-primary" },
    { icon: FileText, label: "Total Contracts", value: data ? data.totalContracts.toLocaleString() : "-", color: "text-accent" },
    { icon: Building2, label: "Agencies Spending", value: data ? `${data.agencyCount}` : "-", color: "text-blue-400" },
    { icon: Trophy, label: "Avg Contract Value", value: data ? formatDollars(data.avgContractValue) : "-", color: "text-emerald-400" },
    { icon: Users, label: "Small Biz Awards", value: data ? formatPercent(data.sbPercent) : "-", color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
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
  );
};
