import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  search_type: string;
  result_count: number | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ["saved-searches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("last_run_at", { ascending: false, nullsLast: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!user,
  });

  const saveSearch = useMutation({
    mutationFn: async (params: {
      name: string;
      query: string;
      filters: any;
      searchType?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("saved_searches")
        .insert({
          user_id: user.id,
          name: params.name,
          query: params.query,
          filters: params.filters,
          search_type: params.searchType || "federal",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success("Search saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save search");
      console.error("Save search error:", error);
    },
  });

  const updateLastRun = useMutation({
    mutationFn: async (searchId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("saved_searches")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", searchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

  const deleteSearch = useMutation({
    mutationFn: async (searchId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", searchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success("Search deleted");
    },
    onError: () => {
      toast.error("Failed to delete search");
    },
  });

  return {
    searches,
    isLoading,
    saveSearch,
    updateLastRun,
    deleteSearch,
  };
}
