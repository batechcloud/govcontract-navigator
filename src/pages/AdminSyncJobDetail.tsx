import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceStrict } from "date-fns";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Square,
  RotateCw,
  Activity,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type SyncJob = {
  id: string;
  job_type: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  started_at: string;
  finished_at: string | null;
  current_offset: number;
  total_records: number | null;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  posted_from: string | null;
  posted_to: string | null;
  last_error: string | null;
  cancel_requested: boolean;
  triggered_by: string | null;
};

type AuditEntry = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  actor_id: string | null;
};

type FailedRecord = {
  id: string;
  contract_id: string | null;
  error: string | null;
  attempts: number;
  resolved: boolean;
  created_at: string;
  payload: Record<string, unknown> | null;
};

type Resp = { job: SyncJob; audit: AuditEntry[]; failed: FailedRecord[] };

const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  queued: "bg-muted text-muted-foreground border-border",
};

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  start_full: { label: "Full import started", icon: Play, tone: "text-blue-400" },
  start_incremental: { label: "Incremental sync started", icon: Play, tone: "text-blue-400" },
  retry_failed: { label: "Retry of failed records started", icon: RotateCw, tone: "text-blue-400" },
  cancel: { label: "Cancellation requested", icon: Square, tone: "text-amber-400" },
  sync_job_completed: { label: "Job completed", icon: CheckCircle2, tone: "text-emerald-400" },
  sync_job_failed: { label: "Job failed", icon: XCircle, tone: "text-red-400" },
};

export default function AdminSyncJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const job = useQuery<Resp>({
    queryKey: ["sync-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sam-sync-control", {
        body: { action: "get_job", job_id: jobId },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as Resp;
    },
    enabled: !!isAdmin && !!jobId,
    refetchInterval: (q) =>
      q.state.data?.job?.status === "running" || q.state.data?.job?.status === "queued" ? 3000 : 60000,
  });

  if (adminLoading) {
    return (
      <DashboardLayout title="Job Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  if (job.isLoading) {
    return (
      <DashboardLayout title="Job Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (job.error || !job.data) {
    return (
      <DashboardLayout title="Job Detail">
        <div className="max-w-3xl mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate("/admin/sync")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="glass border-red-500/30">
            <CardContent className="p-6 text-sm text-red-400">
              {job.error instanceof Error ? job.error.message : "Job not found."}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const j = job.data.job;
  const dur = j.finished_at
    ? formatDistanceStrict(new Date(j.finished_at), new Date(j.started_at))
    : formatDistanceStrict(new Date(), new Date(j.started_at)) + " (ongoing)";

  // Build a unified, timestamp-sorted timeline:
  //  - synthetic "started" event from the job row
  //  - every audit-log entry
  //  - synthetic "finished" event if the job is closed
  const timeline: Array<{
    ts: string;
    kind: keyof typeof ACTION_META | "started" | "finished";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    details?: React.ReactNode;
  }> = [];

  timeline.push({
    ts: j.started_at,
    kind: "started",
    title: `Job started (${j.job_type})`,
    icon: Play,
    tone: "text-blue-400",
    details: j.posted_from ? `Window: ${j.posted_from} → ${j.posted_to}` : undefined,
  });

  for (const a of job.data.audit) {
    const meta = ACTION_META[a.action] ?? {
      label: a.action,
      icon: Activity,
      tone: "text-muted-foreground",
    };
    const d = a.details || {};
    const counts: string[] = [];
    if (typeof d.records_inserted === "number") counts.push(`${d.records_inserted.toLocaleString()} inserted`);
    if (typeof d.records_updated === "number") counts.push(`${d.records_updated.toLocaleString()} updated`);
    if (typeof d.records_failed === "number") counts.push(`${d.records_failed.toLocaleString()} failed`);
    timeline.push({
      ts: a.created_at,
      kind: a.action as keyof typeof ACTION_META,
      title: meta.label,
      icon: meta.icon,
      tone: meta.tone,
      details: (
        <>
          {counts.length > 0 && <div>{counts.join(" · ")}</div>}
          {typeof d.error === "string" && (
            <div className="text-red-400 font-mono text-[11px] mt-1 break-all">{d.error}</div>
          )}
          {typeof d.count === "number" && <div>{d.count} record(s) queued for retry</div>}
        </>
      ),
    });
  }

  if (j.finished_at && !job.data.audit.some((a) => a.action.startsWith("sync_job_"))) {
    timeline.push({
      ts: j.finished_at,
      kind: "finished",
      title: j.status === "completed" ? "Job completed" : `Job ${j.status}`,
      icon: j.status === "completed" ? CheckCircle2 : XCircle,
      tone: j.status === "completed" ? "text-emerald-400" : "text-red-400",
    });
  }

  timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return (
    <DashboardLayout title="Sync Job Detail">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate("/admin/sync")} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to console
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Job <span className="font-mono text-base">{j.id.slice(0, 8)}…</span>
            </h1>
            <Badge variant="outline" className={STATUS_COLORS[j.status]}>
              {j.cancel_requested && j.status === "running" ? "cancelling" : j.status}
            </Badge>
            <Badge variant="outline" className="capitalize">{j.job_type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{j.id}</p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Started" value={format(new Date(j.started_at), "MMM d, HH:mm:ss")} icon={<Clock className="w-4 h-4" />} />
          <Metric
            label="Finished"
            value={j.finished_at ? format(new Date(j.finished_at), "MMM d, HH:mm:ss") : "—"}
            icon={<Clock className="w-4 h-4" />}
          />
          <Metric label="Duration" value={dur} icon={<Activity className="w-4 h-4" />} />
          <Metric
            label="Records"
            value={`${j.current_offset.toLocaleString()} / ${j.total_records?.toLocaleString() ?? "?"}`}
            icon={<Activity className="w-4 h-4" />}
          />
          <Metric label="Inserted" value={j.records_inserted.toLocaleString()} />
          <Metric label="Updated" value={j.records_updated.toLocaleString()} />
          <Metric
            label="Failed"
            value={j.records_failed.toLocaleString()}
            tone={j.records_failed > 0 ? "warn" : undefined}
          />
          <Metric label="Job type" value={j.job_type} />
        </div>

        {j.last_error && (
          <Card className="glass border-red-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" /> Last error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-red-300/90">
                {j.last_error}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <ol className="relative border-l border-border/60 ml-3 space-y-5">
                {timeline.map((evt, i) => {
                  const Icon = evt.icon;
                  return (
                    <li key={i} className="ml-6">
                      <span
                        className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-card border border-border ${evt.tone}`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-sm font-medium text-foreground">{evt.title}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {format(new Date(evt.ts), "MMM d, yyyy HH:mm:ss")}
                        </span>
                      </div>
                      {evt.details && (
                        <div className="text-xs text-muted-foreground mt-1">{evt.details}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Failed records for this job */}
        {job.data.failed.length > 0 && (
          <Card className="glass border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Failed records ({job.data.failed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.data.failed.map((f) => (
                <div key={f.id} className="text-xs border border-border/50 rounded p-2 bg-card/50">
                  <div className="font-mono text-muted-foreground break-all">{f.error || "Unknown error"}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(f.created_at), "MMM d HH:mm:ss")} · attempts {f.attempts}
                    {f.contract_id ? ` · contract ${f.contract_id}` : ""}
                    {f.resolved ? " · resolved" : ""}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <Card className={`glass ${tone === "warn" ? "border-amber-500/30" : ""}`}>
      <CardContent className="p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </div>
        <div className="text-sm font-semibold text-foreground mt-1 truncate">{value}</div>
      </CardContent>
    </Card>
  );
}
