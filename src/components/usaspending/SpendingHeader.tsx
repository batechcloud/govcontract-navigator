import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FISCAL_YEARS } from "@/lib/usaspending-utils";

interface SpendingHeaderProps {
  fy: string;
  onFyChange: (fy: string) => void;
  onRefresh: () => void;
  lastRefreshed: Date | null;
}

export const SpendingHeader = ({ fy, onFyChange, onRefresh, lastRefreshed }: SpendingHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
        USASpending Intelligence
      </h2>
      <p className="text-muted-foreground mt-1">
        Real-time federal spending data powered by USASpending.gov
      </p>
      <div className="flex items-center gap-3 mt-2">
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1.5">
          <Activity className="w-3 h-3" />
          Live Data
        </Badge>
        {lastRefreshed && (
          <span className="text-xs text-muted-foreground">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Select value={fy} onValueChange={onFyChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FISCAL_YEARS.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Refresh
      </Button>
    </div>
  </div>
);
