import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  RefreshCw,
  Square,
  RotateCw,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type SyncJob = {
  id: string;
  job_type: "full" | "incremental" | "manual";
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
};

type StatusResp = {
  running_job: SyncJob | null;
  contracts_count: number;
  failed_count: number;
  last_synced_at: string | null;
};

async function callControl<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sam-sync-control", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message || `Failed: ${action}`);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  queued: "bg-muted text-muted-foreground border-border",
};

export default function AdminSync() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmFullOpen, setConfirmFullOpen] = useState(false);
  const [progressStartedAt, setProgressStartedAt] = useState<number | null>(null);

  const status = useQuery<StatusResp>({
    queryKey: ["sync-status"],
    queryFn: () => callControl<StatusResp>("status"),
    enabled: !!isAdmin,
    refetchInterval: (q) => (q.state.data?.running_job ? 3000 : 30000),
  });

  const jobs = useQuery<{ jobs: SyncJob[] }>({
    queryKey: ["sync-jobs"],
    queryFn: () => callControl("list_jobs"),
    enabled: !!isAdmin,
    refetchInterval: (q) => (status.data?.running_job ? 5000 : 60000),
  });

  const failed = useQuery<{ failed: any[] }>({
    queryKey: ["sync-failed"],
    queryFn: () => callControl("list_failed"),
    enabled: !!isAdmin,
  });

  const startMutation = useMutation({
    mutationFn: (action: "start_full" | "start_incremental") => callControl(action),
    onSuccess: () => {
      toast.success("Sync started");
      setProgressStartedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["sync-status"] });
      qc.invalidateQueries({ queryKey: ["sync-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => callControl("cancel", { job_id: jobId }),
    onSuccess: () => {
      toast.info("Cancellation requested");
      qc.invalidateQueries({ queryKey: ["sync-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const retryMutation = useMutation({
    mutationFn: () => callControl("retry_failed"),
    onSuccess: (d: any) => {
      toast.success(`Retrying ${d?.retried || 0} failed page(s)`);
      qc.invalidateQueries({ queryKey: ["sync-status"] });
      qc.invalidateQueries({ queryKey: ["sync-jobs"] });
      qc.invalidateQueries({ queryKey: ["sync-failed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (adminLoading) {
    return (
      <DashboardLayout title="Sync Console">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const running = status.data?.running_job;
  const progress =
    running && running.total_records
      ? Math.min(100, Math.round((running.current_offset / running.total_records) * 100))
      : null;

  const elapsedSec = running
    ? (Date.now() - new Date(running.started_at).getTime()) / 1000
    : 0;
  const recsPerSec = running && elapsedSec > 0 ? running.current_offset / elapsedSec : 0;
  const eta =
    running && running.total_records && recsPerSec > 0
      ? Math.max(0, Math.round((running.total_records - running.current_offset) / recsPerSec))
      : null;

  return (
    <DashboardLayout title="SAM.gov Sync Console">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">SAM.gov Sync Console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage contract data ingestion. The platform serves users from this internal database — never from a live SAM.gov call.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/audit")}>
            <Activity className="w-4 h-4 mr-2" /> View Audit
          </Button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Database className="w-5 h-5" />}
            label="Contracts in DB"
            value={status.data?.contracts_count?.toLocaleString() ?? "—"}
          />
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            label="Last sync"
            value={
              status.data?.last_synced_at
                ? formatDistanceToNow(new Date(status.data.last_synced_at), { addSuffix: true })
                : "Never"
            }
          />
          <MetricCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Failed pages"
            value={status.data?.failed_count?.toString() ?? "0"}
            tone={status.data?.failed_count ? "warn" : "default"}
          />
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Active job"
            value={running ? running.job_type : "Idle"}
            tone={running ? "active" : "default"}
          />
        </div>

        {/* Action buttons */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => setConfirmFullOpen(true)}
              disabled={!!running || startMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" /> Run Full Import
            </Button>
            <Button
              variant="secondary"
              onClick={() => startMutation.mutate("start_incremental")}
              disabled={!!running || startMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Run Incremental Sync
            </Button>
            <Button
              variant="outline"
              onClick={() => running && cancelMutation.mutate(running.id)}
              disabled={!running || running.cancel_requested}
            >
              <Square className="w-4 h-4 mr-2" /> Stop Current Job
            </Button>
            <Button
              variant="outline"
              onClick={() => retryMutation.mutate()}
              disabled={!status.data?.failed_count || retryMutation.isPending}
            >
              <RotateCw className="w-4 h-4 mr-2" /> Retry Failed Records
            </Button>
          </CardContent>
        </Card>

        {/* Live progress */}
        {running && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Job in progress · {running.job_type}</span>
                  <Badge className={STATUS_COLORS[running.status]} variant="outline">
                    {running.cancel_requested ? "cancelling" : running.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {running.current_offset.toLocaleString()} /{" "}
                      {running.total_records?.toLocaleString() || "?"} records
                    </span>
                    <span>{progress !== null ? `${progress}%` : "—"}</span>
                  </div>
                  <Progress value={progress ?? 0} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <Stat label="Inserted/Updated" value={running.records_inserted.toLocaleString()} />
                  <Stat label="Failed" value={running.records_failed.toString()} />
                  <Stat label="Records/sec" value={recsPerSec ? recsPerSec.toFixed(1) : "—"} />
                  <Stat
                    label="ETA"
                    value={eta !== null ? `${Math.floor(eta / 60)}m ${eta % 60}s` : "—"}
                  />
                </div>
                {running.posted_from && (
                  <p className="text-xs text-muted-foreground">
                    Window: {running.posted_from} → {running.posted_to}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent jobs */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Inserted</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(jobs.data?.jobs || []).map((j) => {
                  const dur =
                    j.finished_at
                      ? Math.round(
                          (new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) /
                            1000,
                        )
                      : null;
                  return (
                    <TableRow
                      key={j.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/admin/sync/jobs/${j.id}`)}
                    >
                      <TableCell className="capitalize">{j.job_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[j.status]}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(j.started_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {dur !== null ? `${Math.floor(dur / 60)}m ${dur % 60}s` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {j.records_inserted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{j.records_failed}</TableCell>
                    </TableRow>
                  );
                })}
                {!jobs.data?.jobs?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                      No sync jobs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Failed records */}
        {!!failed.data?.failed?.length && (
          <Card className="glass border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Failed Records ({failed.data.failed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {failed.data.failed.slice(0, 10).map((f: any) => (
                <div
                  key={f.id}
                  className="text-xs border border-border/50 rounded p-2 bg-card/50"
                >
                  <div className="font-mono text-muted-foreground">{f.error}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    {f.payload?.postedFrom} → {f.payload?.postedTo} · offset{" "}
                    {f.payload?.offset ?? 0} · attempts {f.attempts}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={confirmFullOpen} onOpenChange={setConfirmFullOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Full Import?</AlertDialogTitle>
            <AlertDialogDescription>
              This walks every SAM.gov opportunity from the last 6 months. It can take a long time and will use a lot of API quota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmFullOpen(false);
                startMutation.mutate("start_full");
              }}
            >
              Start Full Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warn" | "active";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-500/30"
      : tone === "active"
      ? "border-primary/40"
      : "";
  return (
    <Card className={`glass ${toneClass}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="text-lg font-heading font-semibold text-foreground truncate">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}
