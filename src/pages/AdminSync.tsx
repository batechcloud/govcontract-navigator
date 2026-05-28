import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import {
  Play, Database, Clock, Activity, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Square, Ban, Gauge,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePageTitle } from "@/hooks/usePageTitle";

type Source = "sam" | "usaspending";

type SyncRun = {
  id: string;
  source: Source;
  status: "running" | "success" | "failure" | "cancelled" | "rate_limited";
  started_at: string;
  finished_at: string | null;
  records_fetched: number;
  records_inserted: number;
  records_updated: number;
  pages: number;
  last_error: string | null;
  manual: boolean;
  window_from: string | null;
  window_to: string | null;
  cancel_requested?: boolean;
};


const SOURCE_META: Record<Source, { label: string; table: string; sub: string }> = {
  usePageTitle("Admin Sync");
  sam: { label: "SAM.gov Opportunities", table: "sam_opportunities", sub: "Federal contract opportunities" },
  usaspending: { label: "USASpending.gov Awards", table: "usaspending_awards", sub: "Prime contract awards" },
};

function statusBadge(s: string) {
  if (s === "success") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />success</Badge>;
  if (s === "failure") return <Badge className="bg-red-500/15 text-red-400 border-red-500/30" variant="outline"><XCircle className="w-3 h-3 mr-1" />failure</Badge>;
  if (s === "running") return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30" variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />running</Badge>;
  if (s === "cancelled") return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30" variant="outline"><Ban className="w-3 h-3 mr-1" />cancelled</Badge>;
  if (s === "rate_limited") return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30" variant="outline"><Gauge className="w-3 h-3 mr-1" />rate limited</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}



export default function AdminSync() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();

  const runs = useQuery({
    queryKey: ["sync-runs"],
    queryFn: async (): Promise<SyncRun[]> => {
      const { data, error } = await supabase
        .from("sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as SyncRun[];
    },
    enabled: !!isAdmin,
    refetchInterval: (q) => {
      const has = q.state.data?.some((r) => r.status === "running");
      return has ? 5_000 : 30_000;
    },
  });

  const counts = useQuery({
    queryKey: ["sync-counts"],
    queryFn: async () => {
      const [sam, usa] = await Promise.all([
        supabase.from("sam_opportunities").select("*", { count: "exact", head: true }),
        supabase.from("usaspending_awards").select("*", { count: "exact", head: true }),
      ]);
      return { sam: sam.count || 0, usaspending: usa.count || 0 };
    },
    enabled: !!isAdmin,
    refetchInterval: 30_000,
  });

  const trigger = useMutation({
    mutationFn: async (source: "sam" | "usaspending" | "both") => {
      const { data, error } = await supabase.functions.invoke("admin-run-sync", {
        body: { source },
      });
      if (error) throw new Error(error.message || "Failed to start sync");
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, source) => {
      toast.success(`Started ${source === "both" ? "both syncs" : source + " sync"}`);
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["sync-runs"] });
        qc.invalidateQueries({ queryKey: ["sync-counts"] });
      }, 1500);
    },
    onError: (e: Error) => toast.error(e.message),

  });

  const cancel = useMutation({
    mutationFn: async (source: "sam" | "usaspending" | "both") => {
      const { data, error } = await supabase.functions.invoke("admin-cancel-sync", {
        body: { source },
      });
      if (error) throw new Error(error.message || "Failed to stop sync");
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (data: any, source) => {
      const n = data?.cancelled?.length ?? 0;
      if (n === 0) toast.info("No running syncs to stop");
      else toast.success(`Stopping ${source === "both" ? "syncs" : source + " sync"}…`);
      qc.invalidateQueries({ queryKey: ["sync-runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  // Toast once whenever a SAM run transitions into rate_limited.
  const notifiedRunIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const r of runs.data ?? []) {
      if (r.source === "sam" && r.status === "rate_limited" && !notifiedRunIds.current.has(r.id)) {
        notifiedRunIds.current.add(r.id);
        toast.error("SAM.gov daily API limit reached", {
          description: "Sync paused automatically. It will resume after the quota resets at midnight UTC.",
          duration: 12000,
        });
      }
    }
  }, [runs.data]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const lastBySource = (s: Source) => runs.data?.find((r) => r.source === s && r.status !== "running");
  const runningBySource = (s: Source) => runs.data?.find((r) => r.source === s && r.status === "running");

  // SAM is locked out if its most recent run within the last 24h is rate_limited.
  const samLastRecent = runs.data?.find((r) => r.source === "sam");
  const samRateLimited = !!samLastRecent
    && samLastRecent.status === "rate_limited"
    && Date.now() - new Date(samLastRecent.started_at).getTime() < 24 * 60 * 60 * 1000;
  const samDisabledTitle = samRateLimited
    ? "SAM.gov daily quota reached — resumes after midnight UTC"
    : undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Data Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nightly at 02:00 UTC. Users query the local database — never the live APIs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => trigger.mutate("both")}
            disabled={trigger.isPending || samRateLimited}
            title={samDisabledTitle}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Run All
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancel.mutate("both")}
            disabled={cancel.isPending || !runs.data?.some((r) => r.status === "running")}
          >
            <Square className="w-4 h-4 mr-2" /> Stop All
          </Button>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {(Object.keys(SOURCE_META) as Source[]).map((src) => {
          const meta = SOURCE_META[src];
          const last = lastBySource(src);
          const running = runningBySource(src);
          const recordCount = src === "sam" ? counts.data?.sam : counts.data?.usaspending;
          return (
            <Card key={src} className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    {meta.label}
                  </span>
                  {running ? statusBadge("running") : last ? statusBadge(last.status) : <Badge variant="outline">idle</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{meta.sub}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Records in DB</div>
                    <div className="text-2xl font-heading font-semibold text-foreground">
                      {recordCount?.toLocaleString() ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last sync
                    </div>
                    <div className="text-sm text-foreground">
                      {last?.finished_at
                        ? formatDistanceToNow(new Date(last.finished_at), { addSuffix: true })
                        : "Never"}
                    </div>
                    {last?.records_inserted ? (
                      <div className="text-[10px] text-muted-foreground">
                        +{last.records_inserted.toLocaleString()} records · {last.pages}p
                      </div>
                    ) : null}
                  </div>
                </div>
                {last?.last_error && (
                  <div className="text-xs p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 flex gap-2 items-start">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="break-all">{last.last_error}</span>
                  </div>
                )}
                {running ? (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => cancel.mutate(src)}
                    disabled={cancel.isPending || !!running.cancel_requested}
                  >
                    {running.cancel_requested ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Stopping…</>
                    ) : (
                      <><Square className="w-4 h-4 mr-2" /> Stop Sync</>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => trigger.mutate(src)}
                    disabled={trigger.isPending || (src === "sam" && samRateLimited)}
                    title={src === "sam" ? samDisabledTitle : undefined}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {src === "sam" && samRateLimited ? "Quota Reached" : "Run Sync Now"}
                  </Button>
                )}


              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Sync Runs
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Fetched</TableHead>
                <TableHead className="text-right">Inserted</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead>Trigger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(runs.data || []).slice(0, 10).map((r) => {
                const dur = r.finished_at
                  ? Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)
                  : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium capitalize">{r.source}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.started_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {dur !== null ? `${Math.floor(dur / 60)}m ${dur % 60}s` : "—"}
                    </TableCell>
                    <TableCell className="text-right">{r.records_fetched.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.records_inserted.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.pages}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.manual ? "Manual" : "Cron"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!runs.data?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                    No sync runs yet. The first run will be triggered by the 02:00 UTC cron, or you can run one manually above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
