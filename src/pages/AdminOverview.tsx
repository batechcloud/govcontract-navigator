import { Navigate, useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  UserMinus,
  LifeBuoy,
  AlertTriangle,
  Database,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  useAdminOverviewStats,
  useAdminSignupsTimeseries,
  useAdminRecentSignups,
  useAdminRecentAudit,
} from "@/hooks/useAdminOverview";
import { useAdminWorkspaces } from "@/hooks/useAdminWorkspaces";

function formatCurrencyCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading } = useAdminOverviewStats();
  const { data: series = [] } = useAdminSignupsTimeseries(30);
  const { data: recentSignups = [] } = useAdminRecentSignups(6);
  const { data: recentAudit = [] } = useAdminRecentAudit(6);
  const { data: workspaces = [] } = useAdminWorkspaces();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const chartData = series.map((s) => ({
    date: format(new Date(s.day), "MMM d"),
    signups: Number(s.signups),
  }));

  const topWorkspaces = [...workspaces]
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform health, growth, and operations at a glance.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          icon={<DollarSign className="w-4 h-4" />}
          label="MRR (est.)"
          value={stats ? formatCurrencyCents(stats.mrr_cents) : "—"}
          sub={`${stats?.active_subscriptions ?? 0} active subs`}
          tone="primary"
          loading={isLoading}
        />
        <Kpi
          icon={<Users className="w-4 h-4" />}
          label="Total users"
          value={stats?.total_users?.toLocaleString() ?? "—"}
          sub={
            stats?.suspended_users
              ? `${stats.suspended_users} suspended`
              : "all active"
          }
          loading={isLoading}
        />
        <Kpi
          icon={<Building2 className="w-4 h-4" />}
          label="Workspaces"
          value={stats?.total_workspaces?.toLocaleString() ?? "—"}
          loading={isLoading}
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4" />}
          label="Signups (30d)"
          value={stats?.signups_30d?.toLocaleString() ?? "—"}
          sub={`${stats?.signups_today ?? 0} today · ${stats?.signups_7d ?? 0} this week`}
          tone="success"
          loading={isLoading}
        />
        <Kpi
          icon={<CreditCard className="w-4 h-4" />}
          label="Active subscriptions"
          value={stats?.active_subscriptions?.toLocaleString() ?? "—"}
          loading={isLoading}
        />
        <Kpi
          icon={<UserMinus className="w-4 h-4" />}
          label="Cancellations (30d)"
          value={stats?.cancellations_30d?.toLocaleString() ?? "—"}
          tone={stats?.cancellations_30d ? "warn" : "default"}
          loading={isLoading}
        />
        <Kpi
          icon={<LifeBuoy className="w-4 h-4" />}
          label="Open support"
          value={stats?.open_support_threads?.toLocaleString() ?? "—"}
          tone={stats?.open_support_threads ? "warn" : "default"}
          loading={isLoading}
        />
        <Kpi
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Failed sync records"
          value={stats?.failed_sync_records?.toLocaleString() ?? "—"}
          tone={stats?.failed_sync_records ? "warn" : "default"}
          loading={isLoading}
        />
      </div>

      {/* Chart + system health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-semibold text-foreground">Signups — last 30 days</h2>
              <p className="text-xs text-muted-foreground">New profiles per day</p>
            </div>
            <Badge variant="outline">{stats?.signups_30d ?? 0} total</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="hsl(var(--primary))"
                  fill="url(#signupFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> System health
          </h2>
          <HealthRow
            label="Last SAM sync"
            value={
              stats?.last_sync_at
                ? formatDistanceToNow(new Date(stats.last_sync_at), { addSuffix: true })
                : "Never"
            }
          />
          <HealthRow
            label="Failed records"
            value={`${stats?.failed_sync_records ?? 0}`}
            tone={stats?.failed_sync_records ? "warn" : "ok"}
          />
          <HealthRow
            label="Open support threads"
            value={`${stats?.open_support_threads ?? 0}`}
            tone={stats?.open_support_threads ? "warn" : "ok"}
          />
          <HealthRow
            label="Suspended users"
            value={`${stats?.suspended_users ?? 0}`}
            tone={stats?.suspended_users ? "warn" : "ok"}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/admin/sync")}
          >
            Open Sync console <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-foreground mb-3">Recent signups</h2>
          <div className="space-y-2">
            {recentSignups.length === 0 && (
              <div className="text-xs text-muted-foreground">No recent signups.</div>
            )}
            {recentSignups.map((s: any) => {
              const name = [s.first_name, s.last_name].filter(Boolean).join(" ") || "New user";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {s.is_suspended && (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                      Suspended
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => navigate("/admin/users")}
          >
            View all users <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading font-semibold text-foreground mb-3">Top workspaces</h2>
          <div className="space-y-2">
            {topWorkspaces.length === 0 && (
              <div className="text-xs text-muted-foreground">No workspaces yet.</div>
            )}
            {topWorkspaces.map((w) => (
              <div
                key={w.workspace_id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{w.workspace_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{w.owner_email}</div>
                </div>
                <Badge variant="outline">{w.member_count} members</Badge>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => navigate("/admin/workspaces")}
          >
            View all workspaces <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading font-semibold text-foreground mb-3">Latest activity</h2>
          <div className="space-y-2">
            {recentAudit.length === 0 && (
              <div className="text-xs text-muted-foreground">No audit entries yet.</div>
            )}
            {recentAudit.map((a: any) => (
              <div
                key={a.id}
                className="text-sm py-1.5 border-b border-border/40 last:border-0"
              >
                <div className="font-medium truncate">{a.action}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => navigate("/admin/audit")}
          >
            View audit log <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = "default",
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "primary" | "success" | "warn";
  loading?: boolean;
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-emerald-400",
    warn: "text-amber-400",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-heading font-bold ${toneClass}`}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

function HealthRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const dot =
    tone === "warn" ? "bg-amber-500" : tone === "ok" ? "bg-emerald-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
