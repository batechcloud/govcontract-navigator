import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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
  type: string;
  setAside: string;
  value: string;
  deadline: string;
  postedDate: string;
  location: string;
  naicsCode: string;
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

// Search contracts using filters
export function useSearchContracts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      filters, 
      page = 0, 
      limit = 10 
    }: { 
      filters: SearchFilters; 
      page?: number; 
      limit?: number;
    }) => {
      // Build a stable cache key from the search params
      const cacheKey = ['sam-search', JSON.stringify(filters), page, limit];

      // Return cached result if available (avoids burning a rate-limited API call)
      const cached = queryClient.getQueryData<{
        results: SearchResult[];
        total: number;
        page: number;
        limit: number;
      }>(cacheKey);

      if (cached) {
        console.log('Using cached SAM search results');
        return cached;
      }

      const { data, error } = await supabase.functions.invoke('sam-search', {
        body: { filters, page, limit }
      });

      if (error) {
        console.error("Search error:", error);
        throw new Error(error.message || "Failed to search contracts");
      }

      const result = data as {
        results: SearchResult[];
        total: number;
        page: number;
        limit: number;
        warning?: string;
      };

      // Show warning toast if the API returned fallback/sample data
      if (result.warning) {
        toast.warning(result.warning, { duration: 6000 });
      }

      // Cache for 10 minutes to prevent duplicate API calls for identical searches
      queryClient.setQueryData(cacheKey, result);

      // Refresh the rate limit counter so the UI updates
      queryClient.invalidateQueries({ queryKey: ['rate-limit'] });

      return result;
    },
    onError: (error: Error) => {
      if (error.message?.includes('Rate limit exceeded') || error.message?.includes('daily limit')) {
        toast.error("Daily search limit reached. Your limit resets at midnight UTC.");
      } else {
        toast.error(error.message || "Search failed. Please try again.");
      }
    }
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
