import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type AuditRow = {
  id: string;
  action: string;
  actor_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const COLORS = {
  success: "hsl(var(--primary))",
  successAlt: "#10b981",
  fail: "#ef4444",
  warn: "#f59e0b",
  muted: "hsl(var(--muted-foreground))",
};

const FAIL_PALETTE = ["#ef4444", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#14b8a6"];

export default function AdminAudit() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  const since = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  // RLS on sync_audit_log restricts SELECT to is_admin(auth.uid()),
  // so non-admins receive zero rows even if they bypass the route guard.
  const audit = useQuery({
    queryKey: ["admin-audit", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_audit_log")
        .select("id, action, actor_id, details, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    enabled: !!isAdmin,
    refetchInterval: 60_000,
  });

  if (adminLoading) {
    return (
      <DashboardLayout title="Admin Audit">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const rows = audit.data ?? [];

  // ---- Login metrics ---------------------------------------------------
  const loginSuccess = rows.filter((r) => r.action === "admin_login_success").length;
  const loginFailure = rows.filter((r) => r.action === "admin_login_failure").length;
  const loginTotal = loginSuccess + loginFailure;
  const loginSuccessRate = loginTotal ? Math.round((loginSuccess / loginTotal) * 100) : 0;

  const loginPie = [
    { name: "Success", value: loginSuccess, color: COLORS.successAlt },
    { name: "Failure", value: loginFailure, color: COLORS.fail },
  ].filter((d) => d.value > 0);

  // Failure reasons aggregation from details.reason / details.stage
  const failureReasonsMap = new Map<string, number>();
  for (const r of rows) {
    if (r.action !== "admin_login_failure") continue;
    const d = r.details || {};
    const reason =
      (typeof d.reason === "string" && d.reason) ||
      (typeof d.stage === "string" && `stage: ${d.stage}`) ||
      "unknown";
    failureReasonsMap.set(reason, (failureReasonsMap.get(reason) ?? 0) + 1);
  }
  const failureReasons = [...failureReasonsMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ---- Sync metrics ----------------------------------------------------
  const syncCompleted = rows.filter((r) => r.action === "sync_job_completed").length;
  const syncFailed = rows.filter((r) => r.action === "sync_job_failed").length;
  const syncTotal = syncCompleted + syncFailed;
  const syncSuccessRate = syncTotal ? Math.round((syncCompleted / syncTotal) * 100) : 0;

  const syncPie = [
    { name: "Completed", value: syncCompleted, color: COLORS.successAlt },
    { name: "Failed", value: syncFailed, color: COLORS.fail },
  ].filter((d) => d.value > 0);

  // Daily sync success vs failure (last 14 days)
  const dailyMap = new Map<string, { date: string; completed: number; failed: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM d");
    dailyMap.set(d, { date: d, completed: 0, failed: 0 });
  }
  for (const r of rows) {
    if (r.action !== "sync_job_completed" && r.action !== "sync_job_failed") continue;
    const key = format(new Date(r.created_at), "MMM d");
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    if (r.action === "sync_job_completed") bucket.completed += 1;
    else bucket.failed += 1;
  }
  const dailySync = [...dailyMap.values()];

  return (
    <DashboardLayout title="Admin Audit">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate("/admin/sync")} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to console
          </Button>
          <h1 className="text-3xl font-heading font-bold text-foreground">Admin Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Login attempts and sync activity from the last 30 days. Admins only.
          </p>
        </div>

        {/* Headline metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Login success rate"
            value={`${loginSuccessRate}%`}
            sub={`${loginSuccess} / ${loginTotal} attempts`}
          />
          <Metric
            icon={<ShieldX className="w-4 h-4" />}
            label="Failed logins"
            value={loginFailure.toString()}
            sub="last 30 days"
            tone={loginFailure > 0 ? "warn" : undefined}
          />
          <Metric
            icon={<Activity className="w-4 h-4" />}
            label="Sync success rate"
            value={`${syncSuccessRate}%`}
            sub={`${syncCompleted} / ${syncTotal} jobs`}
          />
          <Metric
            icon={<XCircle className="w-4 h-4" />}
            label="Sync failures"
            value={syncFailed.toString()}
            sub="last 30 days"
            tone={syncFailed > 0 ? "warn" : undefined}
          />
        </div>

        {/* Login charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Login outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {loginPie.length === 0 ? (
                <EmptyState message="No login attempts recorded yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loginPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {loginPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldX className="w-4 h-4 text-red-400" /> Failure reasons
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {failureReasons.length === 0 ? (
                <EmptyState message="No failed login attempts." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureReasons} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="reason"
                      stroke="hsl(var(--muted-foreground))"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {failureReasons.map((_, i) => (
                        <Cell key={i} fill={FAIL_PALETTE[i % FAIL_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sync charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sync outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {syncPie.length === 0 ? (
                <EmptyState message="No sync jobs in this period." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={syncPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {syncPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Sync activity (last 14 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySync}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="completed" stackId="a" fill={COLORS.successAlt} radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="failed" stackId="a" fill={COLORS.fail} radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent events */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {rows.slice(0, 30).map((r) => (
                  <li key={r.id} className="py-2 flex items-start gap-3">
                    <ActionBadge action={r.action} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy HH:mm:ss")}
                      </div>
                      <div className="text-xs text-foreground/80 truncate">
                        {summarizeDetails(r)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

function Metric({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "warn";
}) {
  return (
    <Card className={`glass ${tone === "warn" ? "border-amber-500/30" : ""}`}>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          {icon} {label}
        </div>
        <div className="text-2xl font-heading font-semibold text-foreground mt-1">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; className: string }> = {
    admin_login_success: { label: "login ok", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    admin_login_failure: { label: "login fail", className: "bg-red-500/15 text-red-400 border-red-500/30" },
    sync_job_completed: { label: "sync ok", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    sync_job_failed: { label: "sync fail", className: "bg-red-500/15 text-red-400 border-red-500/30" },
    start_full: { label: "start full", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    start_incremental: { label: "start incr", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    cancel: { label: "cancel", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    retry_failed: { label: "retry", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    admin_invite_sent: { label: "invite", className: "bg-primary/15 text-primary border-primary/30" },
    admin_setup_run: { label: "setup", className: "bg-primary/15 text-primary border-primary/30" },
  };
  const meta = map[action] || { label: action, className: "" };
  return (
    <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

function summarizeDetails(r: AuditRow): string {
  const d = r.details || {};
  const bits: string[] = [];
  if (typeof d.email === "string") bits.push(d.email);
  if (typeof d.reason === "string") bits.push(`reason: ${d.reason}`);
  if (typeof d.error === "string") bits.push(d.error.slice(0, 120));
  if (typeof d.job_id === "string") bits.push(`job ${d.job_id.slice(0, 8)}…`);
  if (typeof d.records_inserted === "number") bits.push(`${d.records_inserted} inserted`);
  if (typeof d.records_failed === "number" && d.records_failed > 0) bits.push(`${d.records_failed} failed`);
  return bits.join(" · ") || r.action;
}
