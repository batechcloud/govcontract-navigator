import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { SearchFilters, SearchResult } from "./useSearch";

export interface CachedContract {
  id: string;
  contract_id: string;
  title: string | null;
  agency: string | null;
  description: string | null;
  location: string | null;
  value: number | null;
  deadline: string | null;
  posted_date: string | null;
  naics_code: string | null;
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
    type: row.contract_type || "Solicitation",
    setAside: row.set_aside || "Full & Open",
    value: formatCachedValue(row.value),
    deadline: row.deadline || "",
    postedDate: row.posted_date || "",
    location: row.location || "Various",
    naicsCode: row.naics_code || "",
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

// Mapping from friendly labels to raw SAM codes (for backward-compat queries)
const SET_ASIDE_LABEL_TO_RAW: Record<string, string[]> = {
  "Small Business": ["SBP"],
  "8(a)": ["SBA"],
  "SDVOSB": ["SDVOSBC"],
  "VOSB": ["VOSBC"],
  "HUBZone": ["HZC"],
  "WOSB": ["WOSB"],
  "EDWOSB": ["EDWOSB"],
};

function expandSetAsideFilter(labels: string[]): string[] {
  const expanded = new Set<string>();
  for (const label of labels) {
    expanded.add(label);
    const rawCodes = SET_ASIDE_LABEL_TO_RAW[label];
    if (rawCodes) rawCodes.forEach(c => expanded.add(c));
  }
  return Array.from(expanded);
}

/** Search contracts from the shared global contracts table */
export type SortOption = "match_score" | "deadline" | "value" | "posted_date";

export function useCachedSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<(SearchResult & { fetchedAt: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("match_score");

  const searchLocal = async (filters: SearchFilters & { active_only?: boolean; expiring_soon?: boolean; new_this_week?: boolean }, page = 0, limit = 25, sortBy?: SortOption) => {
    const effectiveSort = sortBy ?? currentSort;
    if (!user) return;
    setIsSearching(true);
    try {
      let query = supabase
        .from("contracts" as any)
        .select("*", { count: "exact" });

      // Active only — deadline in the future
      if (filters.active_only) {
        query = query.gt("deadline", new Date().toISOString());
      }

      // Expiring soon — deadline within 14 days
      if (filters.expiring_soon) {
        const now = new Date().toISOString();
        const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gt("deadline", now).lt("deadline", twoWeeks);
      }

      // New this week — posted within last 7 days
      if (filters.new_this_week) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("posted_date", sevenDaysAgo);
      }

      if (filters.keywords && filters.keywords.length > 0) {
        const keyword = filters.keywords.join(" ");
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,agency.ilike.%${keyword}%`);
      }

      // NAICS
      if (filters.naics_codes && filters.naics_codes.length > 0) {
        query = query.in("naics_code", filters.naics_codes);
      }

      // Set-aside — expand to include raw SAM codes for backward compatibility
      if (filters.set_aside && filters.set_aside.length > 0) {
        const expanded = expandSetAsideFilter(filters.set_aside);
        query = query.in("set_aside", expanded);
      }

      // Agency
      if (filters.agencies && filters.agencies.length > 0) {
        const agencyConditions = filters.agencies.map(a => `agency.ilike.%${a}%`).join(",");
        query = query.or(agencyConditions);
      }

      // Value range
      if (filters.min_value) {
        query = query.gte("value", filters.min_value);
      }
      if (filters.max_value) {
        query = query.lte("value", filters.max_value);
      }

      // Location
      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      // Pagination & ordering
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
      setResults(mapped);
      setTotal(count || 0);
      return { results: mapped, total: count || 0 };
    } catch (err) {
      console.error("Contract search error:", err);
      toast.error("Failed to search contracts");
    } finally {
      setIsSearching(false);
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
        .from("contracts" as any)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

/** Trigger an incremental sync from SAM.gov into the shared contracts table */
export function useSyncFromApi() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filters,
      page = 0,
      limit = 25,
    }: {
      filters: SearchFilters;
      page?: number;
      limit?: number;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Call the incremental sync edge function
      const { data, error } = await supabase.functions.invoke("sam-sync-incremental", {
        body: { source: "manual" },
      });

      if (error) throw new Error(error.message || "Sync failed");
      if (data?.error) throw new Error(data.error);

      return {
        synced: data?.synced || 0,
        apiTotal: data?.synced || 0,
        warning: null,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
      queryClient.invalidateQueries({ queryKey: ["rate-limit"] });
      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} new contracts from SAM.gov`);
      } else {
        toast.info("No new contracts found since last sync");
      }
    },
    onError: (error: Error) => {
      if (error.message?.includes("Rate limit") || error.message?.includes("daily limit")) {
        toast.error("Daily search limit reached. Resets at midnight UTC.");
      } else {
        toast.error(error.message || "Sync failed");
      }
    },
  });
}

/** Refresh a single contract from SAM.gov */
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

/** Get sync metadata (last synced time, total count) */
export function useSyncMetadata() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sync-metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_metadata" as any)
        .select("*")
        .eq("id", "sam_sync")
        .single();
      if (error) throw error;
      return data as unknown as { last_synced_at: string; total_synced: number };
    },
    enabled: !!user,
  });
}
