import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrackedContract } from "@/hooks/useTrackedContracts";
import { TrendingUp, DollarSign, Trophy, Clock, AlertTriangle, Lightbulb } from "lucide-react";

const STATUSES = [
  { value: "watching", label: "Saved", color: "bg-muted" },
  { value: "qualifying", label: "Qualifying", color: "bg-primary/60" },
  { value: "proposal", label: "Writing", color: "bg-accent/70" },
  { value: "submitted", label: "Submitted", color: "bg-primary" },
  { value: "won", label: "Won", color: "bg-success" },
  { value: "lost", label: "Lost", color: "bg-destructive/60" },
];

function parseValue(v: string | null): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function PipelineAnalytics({ contracts }: { contracts: TrackedContract[] }) {
  const stats = useMemo(() => {
    const byStatus: Record<string, TrackedContract[]> = {};
    STATUSES.forEach(s => (byStatus[s.value] = []));
    contracts.forEach(c => {
      const key = c.status || "watching";
      if (byStatus[key]) byStatus[key].push(c);
      else byStatus["watching"].push(c);
    });

    const won = byStatus["won"] || [];
    const lost = byStatus["lost"] || [];
    const totalValue = contracts.reduce((s, c) => s + parseValue(c.contract_value), 0);
    const wonValue = won.reduce((s, c) => s + parseValue(c.contract_value), 0);
    const winRate = won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : null;

    const now = Date.now();
    const expiringSoon = contracts.filter(c => {
      if (!c.response_deadline) return false;
      const diff = new Date(c.response_deadline).getTime() - now;
      return diff > 0 && diff < 7 * 86400000;
    });

    const recommendations: string[] = [];
    if (expiringSoon.length > 0) recommendations.push(`${expiringSoon.length} contract${expiringSoon.length > 1 ? "s" : ""} expiring within 7 days — act soon!`);
    const staleQualifying = (byStatus["qualifying"] || []).filter(c => {
      const days = (now - new Date(c.updated_at).getTime()) / 86400000;
      return days > 14;
    });
    if (staleQualifying.length > 0) recommendations.push(`${staleQualifying.length} qualifying contract${staleQualifying.length > 1 ? "s" : ""} idle for 14+ days — move forward or archive.`);
    if (winRate !== null && winRate >= 50) recommendations.push("Your win rate is above average — keep up the momentum!");
    if (winRate !== null && winRate < 30 && won.length + lost.length >= 3) recommendations.push("Win rate is below 30% — consider refining your bid strategy.");
    if (recommendations.length === 0) recommendations.push("Track more opportunities to unlock insights.");

    return { total: contracts.length, totalValue, wonValue, winRate, byStatus, recommendations };
  }, [contracts]);

  const fmtDollars = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Total Pipeline", value: String(stats.total), sub: "opportunities" },
          { icon: DollarSign, label: "Pipeline Value", value: fmtDollars(stats.totalValue), sub: "estimated" },
          { icon: Trophy, label: "Win Rate", value: stats.winRate !== null ? `${stats.winRate}%` : "N/A", sub: stats.winRate !== null ? `${stats.byStatus["won"]?.length || 0} won` : "no outcomes yet" },
          { icon: DollarSign, label: "Won Value", value: fmtDollars(stats.wonValue), sub: `${stats.byStatus["won"]?.length || 0} contracts` },
        ].map((s, i) => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel bar */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Pipeline Funnel</p>
          <div className="flex h-7 rounded-lg overflow-hidden gap-0.5">
            {STATUSES.map(s => {
              const count = stats.byStatus[s.value]?.length || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={s.value}
                  className={`${s.color} flex items-center justify-center text-[10px] font-semibold text-foreground transition-all`}
                  style={{ width: `${Math.max(pct, 6)}%` }}
                  title={`${s.label}: ${count}`}
                >
                  {count > 0 && <span>{count}</span>}
                </div>
              );
            })}
            {stats.total === 0 && <div className="w-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No data</div>}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {STATUSES.map(s => (
              <div key={s.value} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.recommendations.length > 0 && (
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              <p className="text-xs font-medium text-foreground">Recommendations</p>
            </div>
            <ul className="space-y-1">
              {stats.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-accent shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
