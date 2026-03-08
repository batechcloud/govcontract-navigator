import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { SearchFilters, SearchResult } from "./useSearch";

export interface CachedContract {
  id: string;
  user_id: string;
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

/** Convert a cached_contracts row to a SearchResult for the UI */
function toSearchResult(row: CachedContract): SearchResult & { fetchedAt: string } {
  const raw = row.raw_data || {};
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

// Mapping from raw SAM codes to friendly labels (for normalizing on upsert)
const SET_ASIDE_RAW_TO_LABEL: Record<string, string> = {
  SBP: "Small Business",
  SBA: "8(a)",
  SDVOSBC: "SDVOSB",
  VOSBC: "VOSB",
  HZC: "HUBZone",
};

function normalizeSetAsideValue(raw: string | null | undefined): string {
  if (!raw || raw === "NONE") return "Full & Open";
  return SET_ASIDE_RAW_TO_LABEL[raw] || raw;
}

function parseValueToNumeric(val: string): number | null {
  if (!val || val === "TBD" || val === "N/A") return null;
  const clean = val.replace(/[^0-9.MKBmkb]/g, "");
  const num = parseFloat(clean) || 0;
  if (/[Mm]/.test(val)) return num * 1_000_000;
  if (/[Kk]/.test(val)) return num * 1_000;
  if (/[Bb]/.test(val)) return num * 1_000_000_000;
  return num;
}

/** Search contracts from the local cached_contracts table */
export function useCachedSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<(SearchResult & { fetchedAt: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocal = async (filters: SearchFilters, page = 0, limit = 25, sortBy: "match_score" | "deadline" | "value" = "match_score") => {
    if (!user) return;
    setIsSearching(true);
    try {
      let query = supabase
        .from("cached_contracts")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      // Keyword filter — search title and description
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
        // Use ilike for flexible matching
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
      query = query
        .order("match_score", { ascending: false, nullsFirst: false })
        .order("fetched_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const mapped = (data || []).map(row => toSearchResult(row as CachedContract));
      setResults(mapped);
      setTotal(count || 0);
      return { results: mapped, total: count || 0 };
    } catch (err) {
      console.error("Local cache search error:", err);
      toast.error("Failed to search cached contracts");
    } finally {
      setIsSearching(false);
    }
  };

  return { results, total, isSearching, searchLocal };
}

/** Get the count of cached contracts for the current user */
export function useCacheCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cached-contracts-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("cached_contracts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

/** Sync contracts from the SAM API into the local cache */
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

      // 1. Call the SAM search edge function
      const { data, error } = await supabase.functions.invoke("sam-search", {
        body: { filters, page, limit },
      });

      if (error) throw new Error(error.message || "SAM API search failed");

      const results = (data?.results || []) as SearchResult[];
      const warning = data?.warning;

      if (results.length === 0) {
        return { synced: 0, apiTotal: data?.total || 0, warning };
      }

      // 2. Upsert into cached_contracts
      const rows = results.map((r) => ({
        user_id: user.id,
        contract_id: r.id,
        title: r.title,
        agency: r.agency,
        description: r.description || null,
        location: r.location || null,
        value: parseValueToNumeric(r.value),
        deadline: r.deadline || null,
        posted_date: r.postedDate || null,
        naics_code: r.naicsCode || null,
        set_aside: normalizeSetAsideValue(r.setAside),
        contract_type: r.type || null,
        sector: null,
        source: "SAM.gov",
        url: r.link || null,
        match_score: r.matchScore || null,
        resource_links: r.resourceLinks || [],
        solicitation_number: r.solicitationNumber || null,
        raw_data: r as any,
        fetched_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from("cached_contracts")
        .upsert(rows, { onConflict: "contract_id,user_id" });

      if (upsertError) {
        console.error("Cache upsert error:", upsertError);
        throw new Error("Failed to cache contracts");
      }

      return { synced: results.length, apiTotal: data?.total || 0, warning };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cached-contracts-count"] });
      queryClient.invalidateQueries({ queryKey: ["rate-limit"] });
      if (data.warning) {
        toast.warning(data.warning, { duration: 6000 });
      }
      toast.success(`Synced ${data.synced} contracts from SAM.gov`);
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

      // Update the cached row
      const { error: updateError } = await supabase
        .from("cached_contracts")
        .update({
          title: r.title,
          agency: r.agency,
          description: r.description || null,
          location: r.location || null,
          value: parseValueToNumeric(r.value),
          deadline: r.deadline || null,
          posted_date: r.postedDate || null,
          naics_code: r.naicsCode || null,
          set_aside: normalizeSetAsideValue(r.setAside),
          contract_type: r.type || null,
          url: r.link || null,
          match_score: r.matchScore || null,
          resource_links: r.resourceLinks || [],
          solicitation_number: r.solicitationNumber || null,
          raw_data: r,
          fetched_at: new Date().toISOString(),
        })
        .eq("contract_id", contractId)
        .eq("user_id", user.id);

      if (updateError) throw new Error("Failed to update cache");

      return r;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cached-contracts-count"] });
      toast.success("Contract refreshed with latest data");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to refresh contract");
    },
  });
}
