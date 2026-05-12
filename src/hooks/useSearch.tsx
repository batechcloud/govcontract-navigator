import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { applyContractFilters } from "@/lib/contracts-query";

export interface SearchFilters {
  keywords: string[];
  naics_codes: string[];
  psc_codes: string[];
  set_aside: string[];
  agencies: string[];
  min_value: number | null;
  max_value: number | null;
  location: string | null;
  opportunity_type: string | null;
}

export interface SearchResult {
  id: string;
  title: string;
  agency: string;
  parentAgency?: string | null;
  type: string;
  setAside: string;
  value: string;
  deadline: string;
  postedDate: string;
  location: string;
  naicsCode: string;
  pscCode?: string | null;
  matchScore: number;
  description: string;
  solicitationNumber?: string;
  link?: string;
  resourceLinks?: string[];
}

export interface SubawardResult {
  id: string;
  subaward_number: string;
  prime_award_id: string;
  prime_recipient: string;
  subawardee: string;
  amount: number;
  description: string;
  action_date: string;
  place_of_performance: string;
  agency: string;
}

export interface ParsedQuery {
  filters: SearchFilters;
  original_query: string;
}

// Parse natural language query using AI
export function useParseSearchQuery() {
  return useMutation({
    mutationFn: async (query: string): Promise<ParsedQuery> => {
      const { data, error } = await supabase.functions.invoke('parse-search-query', {
        body: { query }
      });

      if (error) {
        console.error("Parse error:", error);
        throw new Error(error.message || "Failed to parse search query");
      }

      return data;
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message.includes("Payment required")) {
        toast.error("AI credits exhausted. Please add funds.");
      }
    }
  });
}

// Search contracts — reads ONLY from the local `contracts` table.
// Live SAM.gov calls happen via the admin-managed sync pipeline.

function formatVal(v: number | null): string {
  if (!v) return "TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function useSearchContracts() {
  // Drop stale responses if a newer request started while we were waiting.
  // Without this, rapid clicks on Search can cause an earlier slow query's
  // results to overwrite a later fast query's results.
  const requestIdRef = useRef(0);

  return useMutation({
    mutationFn: async ({
      filters,
      page = 0,
      limit = 10,
    }: {
      filters: SearchFilters;
      page?: number;
      limit?: number;
    }) => {
      const myReqId = ++requestIdRef.current;
      let query = supabase.from("contracts" as any).select("*", { count: "exact" });
      query = applyContractFilters(query, filters);

      query = query
        .order("match_score", { ascending: false, nullsFirst: false })
        .order("posted_date", { ascending: false, nullsFirst: false })
        .range(page * limit, (page + 1) * limit - 1);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      // Stale-response guard: if a newer request started while we were
      // waiting on this one, throw so React Query treats it as cancelled.
      if (requestIdRef.current !== myReqId) {
        throw new Error("__superseded__");
      }

      const results: SearchResult[] = ((data || []) as any[]).map((r) => ({
        id: r.contract_id,
        title: r.title || "Untitled",
        agency: r.agency || "Federal Agency",
        parentAgency: r.parent_agency ?? null,
        type: r.contract_type || "Solicitation",
        setAside: r.set_aside || "Full & Open",
        value: formatVal(r.value),
        deadline: r.deadline || "",
        postedDate: r.posted_date || "",
        location: r.location || "Various",
        naicsCode: r.naics_code || "",
        pscCode: r.psc_code ?? null,
        matchScore: r.match_score || 70,
        description: r.description || "",
        solicitationNumber: r.solicitation_number || "",
        link: r.url || "",
        resourceLinks: r.resource_links || [],
      }));

      return { results, total: count || 0, page, limit };
    },
    onError: (error: Error) => {
      if (error.message === "__superseded__") return; // stale race, silent
      toast.error(error.message || "Search failed. Please try again.");
    },
  });
}

// Combined search: parse query then search
export function useSmartSearch() {
  const parseQuery = useParseSearchQuery();
  const searchContracts = useSearchContracts();
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [parsedFilters, setParsedFilters] = useState<SearchFilters | null>(null);
  const [total, setTotal] = useState(0);
  const [currentBatchPage, setCurrentBatchPage] = useState(0);
  const [batchBoundaries, setBatchBoundaries] = useState<number[]>([]);

  const hasMore = allResults.length < total;

  const search = async (query: string, page = 0) => {
    const prevResults = allResults;
    const prevTotal = total;
    setIsSearching(true);
    setCurrentBatchPage(0);
    try {
      const parsed = await parseQuery.mutateAsync(query);
      setParsedFilters(parsed.filters);

      const searchResults = await searchContracts.mutateAsync({
        filters: parsed.filters,
        page,
        limit: 10
      });

      setResults(searchResults.results);
      setAllResults(searchResults.results);
      setBatchBoundaries([]);
      setTotal(searchResults.total);
      return searchResults;
    } catch (error) {
      // A superseded request means a newer search already replaced the state
      // and we should NOT restore prev — restoring would clobber the winning
      // (faster) request's results that already landed.
      if ((error as Error)?.message === "__superseded__") return;
      // Restore previous results so the UI doesn't go blank on rate-limit errors
      setResults(prevResults);
      setAllResults(prevResults);
      setTotal(prevTotal);
      console.error("Smart search error:", error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  const searchWithFilters = async (filters: SearchFilters, page = 0) => {
    const prevResults = allResults;
    const prevTotal = total;
    setIsSearching(true);
    setCurrentBatchPage(0);
    try {
      setParsedFilters(filters);
      const searchResults = await searchContracts.mutateAsync({
        filters,
        page,
        limit: 10
      });

      setResults(searchResults.results);
      setAllResults(searchResults.results);
      setBatchBoundaries([]);
      setTotal(searchResults.total);
      return searchResults;
    } catch (error) {
      if ((error as Error)?.message === "__superseded__") return;
      // Restore previous results so the UI doesn't go blank on rate-limit errors
      setResults(prevResults);
      setAllResults(prevResults);
      setTotal(prevTotal);
      console.error("Filter search error:", error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  const loadNextBatch = async () => {
    if (!parsedFilters || !hasMore) return;
    setIsLoadingBatch(true);
    try {
      const nextPage = currentBatchPage + 1;
      const searchResults = await searchContracts.mutateAsync({
        filters: parsedFilters,
        page: nextPage,
        limit: 10
      });

      const existingIds = new Set(allResults.map(r => r.id));
      const uniqueNew = searchResults.results.filter(r => !existingIds.has(r.id));

      if (uniqueNew.length > 0) {
        setBatchBoundaries(prev => [...prev, allResults.length]);
        setAllResults(prev => [...prev, ...uniqueNew]);
        setResults(prev => [...prev, ...uniqueNew]);
      }
      setCurrentBatchPage(nextPage);
      setTotal(searchResults.total);
    } catch (error) {
      console.error("Load next batch error:", error);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  return {
    search,
    searchWithFilters,
    loadNextBatch,
    isSearching,
    isLoadingBatch,
    results,
    parsedFilters,
    total,
    hasMore,
    batchBoundaries,
    isParsing: parseQuery.isPending,
    isSearchingContracts: searchContracts.isPending
  };
}

// Saved searches hooks
export function useSavedSearches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}

export function useSaveSearch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      query, 
      filters,
      searchType = 'federal'
    }: { 
      name: string; 
      query: string; 
      filters: SearchFilters;
      searchType?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name,
          query,
          filters: filters as any,
          search_type: searchType,
          last_run_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success("Search saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save search");
    }
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success("Search deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete search");
    }
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      resultCount 
    }: { 
      id: string; 
      resultCount: number;
    }) => {
      const { error } = await supabase
        .from('saved_searches')
        .update({
          result_count: resultCount,
          last_run_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    }
  });
}

// Search subawards via USASpending
export function useSubawardSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      keyword = "",
      page = 1,
      limit = 25,
      sort = "amount",
      order = "desc",
      prime_contractor,
      min_amount,
      max_amount,
      agency,
    }: {
      keyword?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
      prime_contractor?: string;
      min_amount?: number;
      max_amount?: number;
      agency?: string;
    }) => {
      const cacheKey = ['subaward-search', keyword, page, limit, sort, order, prime_contractor, min_amount, max_amount, agency];
      const cached = queryClient.getQueryData<{ results: SubawardResult[]; page_metadata: any }>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase.functions.invoke('usaspending-search', {
        body: { action: 'search_subawards', params: { keyword, page, limit, sort, order, prime_contractor, min_amount, max_amount, agency } },
      });

      if (error) throw new Error(error.message || "Failed to search subawards");

      // Normalize results
      const rawResults = data?.results || [];
      const normalized: SubawardResult[] = rawResults.map((r: any, i: number) => ({
        id: r.id?.toString() || `sub-${page}-${i}`,
        subaward_number: r.subaward_number || "N/A",
        prime_award_id: r.prime_award_internal_id?.toString() || r.prime_award_generated_internal_id || "",
        prime_recipient: r.prime_recipient_name || "Unknown",
        subawardee: r.sub_awardee_or_recipient_legal || r.recipient_name || "Unknown",
        amount: r.subaward_amount || r.amount || 0,
        description: r.subaward_description || r.description || "",
        action_date: r.subaward_action_date || r.action_date || "",
        place_of_performance: [r.sub_legal_entity_city_name, r.sub_legal_entity_state_code].filter(Boolean).join(", ") || "N/A",
        agency: r.awarding_agency_name || "",
      }));

      const result = { results: normalized, page_metadata: data?.page_metadata || { page, total: data?.results?.length || 0, hasNext: data?.page_metadata?.hasNext ?? false } };
      queryClient.setQueryData(cacheKey, result);
      return result;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Subaward search failed");
    },
  });
}
