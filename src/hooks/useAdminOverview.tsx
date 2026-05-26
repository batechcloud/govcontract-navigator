import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminOverviewStats = {
  total_workspaces: number;
  total_users: number;
  suspended_users: number;
  active_subscriptions: number;
  mrr_cents: number;
  signups_today: number;
  signups_7d: number;
  signups_30d: number;
  cancellations_30d: number;
  open_support_threads: number;
  failed_sync_records: number;
  last_sync_at: string | null;
};

export function useAdminOverviewStats() {
  return useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview_stats" as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as AdminOverviewStats | null;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useAdminSignupsTimeseries(days = 30) {
  return useQuery({
    queryKey: ["admin-signups-timeseries", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_signups_timeseries" as any, {
        _days: days,
      });
      if (error) throw error;
      return (data ?? []) as { day: string; signups: number }[];
    },
    staleTime: 60_000,
  });
}

export function useAdminRecentSignups(limit = 8) {
  return useQuery({
    queryKey: ["admin-recent-signups", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_signups" as any, {
        _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        created_at: string;
        is_suspended: boolean;
      }[];
    },
    staleTime: 60_000,
  });
}

export function useAdminRecentAudit(limit = 8) {
  return useQuery({
    queryKey: ["admin-recent-audit", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_audit_log")
        .select("id, action, actor_id, created_at, details")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
