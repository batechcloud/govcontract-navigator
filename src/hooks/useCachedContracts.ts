import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { SearchFilters, SearchResult } from "./useSearch";
import { applyContractFilters } from "@/lib/contracts-query";

export interface CachedContract {
  id: string;
  contract_id: string;
  title: string | null;
  agency: string | null;
  parent_agency: string | null;
  description: string | null;
  location: string | null;
  value: number | null;
  deadline: string | null;
  posted_date: string | null;
  naics_code: string | null;
  psc_code: string | null;
  set_aside: string | null;
  contract_type: string | null;
  sector: string | null;
  source: string | null;
  url: string | null;
  match_score: number | null;
  resource_links: string[] | null;
  solicitation_number: string | null;
  raw_data: any;
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

/** Convert a contracts row to a SearchResult for the UI */
function toSearchResult(row: CachedContract): SearchResult & { fetchedAt: string } {
  return {
    id: row.contract_id,
    title: row.title || "Untitled",
    agency: row.agency || "Federal Agency",
    parentAgency: row.parent_agency ?? null,
    type: row.contract_type || "Solicitation",
    setAside: row.set_aside || "Full & Open",
    value: formatCachedValue(row.value),
    deadline: row.deadline || "",
    postedDate: row.posted_date || "",
    location: row.location || "Various",
    naicsCode: row.naics_code || "",
    pscCode: row.psc_code ?? null,
    matchScore: row.match_score || 70,
    description: row.description || "",
    solicitationNumber: row.solicitation_number || "",
    link: row.url || "",
    resourceLinks: row.resource_links || [],
    fetchedAt: row.fetched_at,
  };
}

function formatCachedValue(v: number | null): string {
  if (!v) return "TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

/** Search contracts from the shared global contracts table */
export type SortOption = "match_score" | "deadline" | "value" | "posted_date";

// Stable cache key for a (filters, sort, page) tuple.
function cachedSearchKey(
  filters: SearchFilters & { active_only?: boolean; expiring_soon?: boolean; new_this_week?: boolean },
  sort: SortOption,
  page: number,
  limit: number,
) {
  const norm = {
    keywords: [...(filters.keywords || [])].sort(),
    naics_codes: [...(filters.naics_codes || [])].sort(),
    psc_codes: [...(filters.psc_codes || [])].sort(),
    set_aside: [...(filters.set_aside || [])].sort(),
    agencies: [...(filters.agencies || [])].sort(),
    min_value: filters.min_value ?? null,
    max_value: filters.max_value ?? null,
    location: filters.location ?? null,
    opportunity_type: filters.opportunity_type ?? null,
    active_only: !!filters.active_only,
    expiring_soon: !!filters.expiring_soon,
    new_this_week: !!filters.new_this_week,
  };
  return ["cached-search", norm, sort, page, limit] as const;
}

export function useCachedSearch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [results, setResults] = useState<(SearchResult & { fetchedAt: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("deadline");

  // Stale-response guard — see comment in useSearchContracts.
  const requestIdRef = useRef(0);

  const searchLocal = async (
    filters: SearchFilters & { active_only?: boolean; expiring_soon?: boolean; new_this_week?: boolean },
    page = 0,
    limit = 25,
    sortBy?: SortOption,
  ) => {
    const effectiveSort = sortBy ?? currentSort;
    if (!user) return;
    const myReqId = ++requestIdRef.current;
    setIsSearching(true);
    try {
      // React Query dedupes + caches identical searches. Re-navigating to
      // /dashboard/search with the same filters returns instantly.
      const payload = await queryClient.fetchQuery({
        queryKey: cachedSearchKey(filters, effectiveSort, page, limit),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        queryFn: async () => {
          let query = supabase
            .from("sam_opportunities_compat" as any)
            .select("*", { count: "estimated" });

          if (filters.active_only) {
            query = query.gt("deadline", new Date().toISOString());
          }
          if (filters.expiring_soon) {
            const now = new Date().toISOString();
            const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gt("deadline", now).lt("deadline", twoWeeks);
          }
          if (filters.new_this_week) {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gte("posted_date", sevenDaysAgo);
          }

          query = applyContractFilters(query, filters);

          if (effectiveSort === "deadline") {
            query = query
              .order("deadline", { ascending: true, nullsFirst: false })
              .order("match_score", { ascending: false, nullsFirst: false });
          } else if (effectiveSort === "value") {
            query = query
              .order("value", { ascending: false, nullsFirst: false })
              .order("match_score", { ascending: false, nullsFirst: false });
          } else if (effectiveSort === "posted_date") {
            query = query
              .order("posted_date", { ascending: false, nullsFirst: false })
              .order("match_score", { ascending: false, nullsFirst: false });
          } else {
            query = query
              .order("match_score", { ascending: false, nullsFirst: false })
              .order("fetched_at", { ascending: false });
          }
          query = query.range(page * limit, (page + 1) * limit - 1);

          const { data, error, count } = await query;
          if (error) throw error;

          const mapped = (data || []).map(row => toSearchResult(row as unknown as CachedContract));
          return { mapped, count: count || 0 };
        },
      });

      // Drop superseded responses.
      if (requestIdRef.current !== myReqId) {
        return { results: [], total: 0, superseded: true };
      }

      setResults(payload.mapped);
      setTotal(payload.count);
      return { results: payload.mapped, total: payload.count };
    } catch (err) {
      console.error("Contract search error:", err);
      toast.error("Failed to search contracts");
    } finally {
      if (requestIdRef.current === myReqId) setIsSearching(false);
    }
  };

  return { results, total, isSearching, searchLocal, currentSort, setCurrentSort };
}


/** Get the total count of contracts in the shared cache */
export function useCacheCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contracts-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sam_opportunities_compat" as any)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

/**
 * Legacy hook kept for UI compatibility. Users no longer trigger live
 * SAM.gov syncs — the nightly cron handles ingestion. This hook now just
 * resolves immediately so callers can still await it without breaking flow.
 */
export function useSyncFromApi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // No-op: data is refreshed nightly by the cron-driven nightly-sync-sam
      // edge function. Return zero so the UI doesn't claim new inserts.
      return { synced: 0, apiTotal: 0, warning: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
    },
  });
}

/** Refresh a single contract from SAM.gov — still uses the targeted edge fn. */
export function useRefreshContract() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      solicitationNumber,
    }: {
      contractId: string;
      solicitationNumber?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase.functions.invoke("sam-refresh-single", {
        body: { noticeId: contractId, solicitationNumber },
      });

      if (error) throw new Error(error.message || "Refresh failed");
      if (data?.error) throw new Error(data.error);

      const r = data?.result;
      if (!r) throw new Error("No data returned from SAM.gov");

      return r;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
      toast.success("Contract refreshed with latest data");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to refresh contract");
    },
  });
}

/** Get last successful sync time for SAM from sync_cursors. */
export function useSyncMetadata() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sync-metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_cursors" as any)
        .select("last_synced_at")
        .eq("source", "sam")
        .maybeSingle();
      if (error) throw error;
      return {
        last_synced_at: (data as any)?.last_synced_at ?? null,
        total_synced: 0,
      } as { last_synced_at: string | null; total_synced: number };
    },
    enabled: !!user,
  });
}

