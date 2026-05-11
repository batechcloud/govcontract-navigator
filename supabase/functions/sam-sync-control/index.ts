// Admin-only control plane for SAM.gov sync jobs.
// Actions: start_full, start_incremental, cancel, retry_failed, status, list_jobs, list_failed.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { adminClient, runFullImport, runIncrementalImport } from "../_shared/sam-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// EdgeRuntime is provided by Supabase's edge runtime
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const BodySchema = z.object({
  action: z.enum([
    "start_full",
    "start_incremental",
    "cancel",
    "retry_failed",
    "status",
    "list_jobs",
    "list_failed",
    "get_job",
  ]),
  job_id: z.string().uuid().optional(),
  failed_record_ids: z.array(z.string().uuid()).max(100).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require Bearer token unless it's a service-role cron call
  const authHeader = req.headers.get("Authorization") || "";
  const isServiceRoleCall = authHeader === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;

  let actorId: string | null = null;
  let isAdmin = isServiceRoleCall;

  if (!isServiceRoleCall) {
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await userClient.auth.getUser(token);
    if (error || !user) return json({ error: "Unauthorized" }, 401);
    actorId = user.id;

    // Single source of truth: ADMIN_EMAILS env var (also synced to admin_emails table for RLS).
    const allowed = (Deno.env.get("ADMIN_EMAILS") ?? "")
      .split(/[,\s;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    isAdmin = !!user.email && allowed.includes(user.email.toLowerCase());
  }

  if (!isAdmin) return json({ error: "Admin role required" }, 403);

  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return json({ error: "Invalid request", details: String(e) }, 400);
  }

  const supabase = adminClient();
  const apiKey = Deno.env.get("SAM_API_KEY");

  switch (body.action) {
    case "start_full":
    case "start_incremental": {
      if (!apiKey) return json({ error: "SAM_API_KEY not configured" }, 500);

      // Block if a job is already running
      const { data: running } = await supabase
        .from("sync_jobs")
        .select("id")
        .eq("status", "running")
        .limit(1);
      if (running && running.length > 0) {
        return json({ error: "A sync job is already running", job_id: running[0].id }, 409);
      }

      const jobType = body.action === "start_full" ? "full" : (isServiceRoleCall ? "incremental" : "manual");
      const { data: job, error: insertErr } = await supabase
        .from("sync_jobs")
        .insert({
          job_type: jobType,
          status: "running",
          triggered_by: actorId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr || !job) return json({ error: insertErr?.message || "Failed to create job" }, 500);

      await supabase.from("sync_audit_log").insert({
        actor_id: actorId,
        action: body.action,
        details: { job_id: job.id },
      });

      // Run in background
      const worker = body.action === "start_full"
        ? runFullImport(supabase, job.id, apiKey)
        : runIncrementalImport(supabase, job.id, apiKey);

      EdgeRuntime.waitUntil(
        worker
          .then(async () => {
            const { data: finished } = await supabase
              .from("sync_jobs")
              .select("status, records_inserted, records_updated, records_failed")
              .eq("id", job.id)
              .maybeSingle();
            await supabase.from("sync_audit_log").insert({
              actor_id: actorId,
              action: "sync_job_completed",
              details: { job_id: job.id, ...finished },
            });
          })
          .catch(async (err) => {
            console.error("Sync worker error:", err);
            const message = err instanceof Error ? err.message : String(err);
            await supabase
              .from("sync_jobs")
              .update({
                status: "failed",
                finished_at: new Date().toISOString(),
                last_error: message,
              })
              .eq("id", job.id);
            await supabase.from("sync_audit_log").insert({
              actor_id: actorId,
              action: "sync_job_failed",
              details: { job_id: job.id, error: message },
            });
          }),
      );

      return json({ ok: true, job_id: job.id });
    }

    case "cancel": {
      if (!body.job_id) return json({ error: "job_id required" }, 400);
      await supabase.from("sync_jobs").update({ cancel_requested: true }).eq("id", body.job_id);
      await supabase.from("sync_audit_log").insert({
        actor_id: actorId,
        action: "cancel",
        details: { job_id: body.job_id },
      });
      return json({ ok: true });
    }

    case "retry_failed": {
      if (!apiKey) return json({ error: "SAM_API_KEY not configured" }, 500);
      const ids = body.failed_record_ids;
      let q = supabase.from("sync_failed_records").select("*").eq("resolved", false);
      if (ids && ids.length > 0) q = q.in("id", ids);
      const { data: failed } = await q.limit(50);
      if (!failed || failed.length === 0) return json({ ok: true, retried: 0 });

      // Create a retry job
      const { data: job } = await supabase
        .from("sync_jobs")
        .insert({
          job_type: "manual",
          status: "running",
          triggered_by: actorId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      await supabase.from("sync_audit_log").insert({
        actor_id: actorId,
        action: "retry_failed",
        details: { job_id: job?.id, count: failed.length },
      });

      EdgeRuntime.waitUntil((async () => {
        const counters = { inserted: 0, updated: 0, failed: 0 };
        const { runWindow } = await import("../_shared/sam-sync.ts");
        for (const rec of failed) {
          const p = (rec.payload || {}) as { postedFrom?: string; postedTo?: string; offset?: number };
          if (!p.postedFrom || !p.postedTo) continue;
          const out = await runWindow(supabase, job!.id, apiKey, p.postedFrom, p.postedTo, p.offset ?? 0, counters);
          await supabase.from("sync_failed_records").update({ resolved: true, attempts: (rec.attempts || 0) + 1 }).eq("id", rec.id);
          if (out === "cancelled") break;
        }
        await supabase.from("sync_jobs").update({
          status: "completed",
          finished_at: new Date().toISOString(),
          records_inserted: counters.inserted,
          records_failed: counters.failed,
        }).eq("id", job!.id);
      })());

      return json({ ok: true, job_id: job?.id, retried: failed.length });
    }

    case "status": {
      const { data: running } = await supabase
        .from("sync_jobs")
        .select("*")
        .in("status", ["running", "queued"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: contractsCount } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true });

      const { count: failedCount } = await supabase
        .from("sync_failed_records")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false);

      const { data: meta } = await supabase
        .from("sync_metadata")
        .select("last_synced_at, total_synced")
        .eq("id", "sam_sync")
        .maybeSingle();

      return json({
        running_job: running,
        contracts_count: contractsCount ?? 0,
        failed_count: failedCount ?? 0,
        last_synced_at: meta?.last_synced_at ?? null,
      });
    }

    case "list_jobs": {
      const { data } = await supabase
        .from("sync_jobs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(25);
      return json({ jobs: data ?? [] });
    }

    case "list_failed": {
      const { data } = await supabase
        .from("sync_failed_records")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50);
      return json({ failed: data ?? [] });
    }

    case "get_job": {
      if (!body.job_id) return json({ error: "job_id required" }, 400);

      const { data: job } = await supabase
        .from("sync_jobs")
        .select("*")
        .eq("id", body.job_id)
        .maybeSingle();
      if (!job) return json({ error: "Job not found" }, 404);

      // Audit-log entries that reference this job
      const { data: audit } = await supabase
        .from("sync_audit_log")
        .select("id, action, details, created_at, actor_id")
        .filter("details->>job_id", "eq", body.job_id)
        .order("created_at", { ascending: true })
        .limit(500);

      const { data: failed } = await supabase
        .from("sync_failed_records")
        .select("id, contract_id, error, attempts, resolved, created_at, payload")
        .eq("job_id", body.job_id)
        .order("created_at", { ascending: true })
        .limit(200);

      return json({ job, audit: audit ?? [], failed: failed ?? [] });
    }
  }

  return json({ error: "Unknown action" }, 400);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
