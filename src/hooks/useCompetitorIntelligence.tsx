import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface TrackedCompetitor {
  id: string;
  user_id: string;
  competitor_name: string;
  competitor_uei: string | null;
  competitor_cage: string | null;
  naics_codes: string[];
  total_awards: number;
  total_value: number;
  last_synced_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorAward {
  id: string;
  tracked_competitor_id: string;
  user_id: string;
  award_id: string;
  award_description: string | null;
  awarding_agency: string | null;
  award_amount: number | null;
  award_date: string | null;
  naics_code: string | null;
  psc_code: string | null;
  place_of_performance: string | null;
  created_at: string;
}

export interface WinLossRecord {
  id: string;
  user_id: string;
  opportunity_id: string | null;
  opportunity_title: string;
  agency: string | null;
  outcome: "won" | "lost" | "no_bid" | "pending";
  award_amount: number | null;
  bid_amount: number | null;
  winner_name: string | null;
  winner_uei: string | null;
  loss_reason: string | null;
  lessons_learned: string | null;
  bid_date: string | null;
  decision_date: string | null;
  created_at: string;
  updated_at: string;
}

// Tracked Competitors hooks
export function useTrackedCompetitors() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tracked-competitors", user?.id],
    queryFn: async (): Promise<TrackedCompetitor[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tracked_competitors")
        .select("*")
        .eq("user_id", user.id)
        .order("total_value", { ascending: false });

      if (error) throw error;
      return data as TrackedCompetitor[];
    },
    enabled: !!user,
  });
}

export function useTrackCompetitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitor: Partial<TrackedCompetitor>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tracked_competitors")
        .upsert({
          user_id: user.id,
          competitor_name: competitor.competitor_name,
          competitor_uei: competitor.competitor_uei,
          competitor_cage: competitor.competitor_cage,
          naics_codes: competitor.naics_codes || [],
          total_awards: competitor.total_awards || 0,
          total_value: competitor.total_value || 0,
          notes: competitor.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-competitors"] });
      toast({ title: "Competitor tracked", description: "You'll see their award activity." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUntrackCompetitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitorId: string) => {
      const { error } = await supabase
        .from("tracked_competitors")
        .delete()
        .eq("id", competitorId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-competitors"] });
      toast({ title: "Competitor removed", description: "No longer tracking this competitor." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Competitor Awards hooks
export function useCompetitorAwards(competitorId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["competitor-awards", competitorId],
    queryFn: async (): Promise<CompetitorAward[]> => {
      if (!user || !competitorId) return [];

      const { data, error } = await supabase
        .from("competitor_awards")
        .select("*")
        .eq("tracked_competitor_id", competitorId)
        .order("award_date", { ascending: false });

      if (error) throw error;
      return data as CompetitorAward[];
    },
    enabled: !!user && !!competitorId,
  });
}

// Win/Loss Records hooks
export function useWinLossRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["win-loss-records", user?.id],
    queryFn: async (): Promise<WinLossRecord[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("win_loss_records")
        .select("*")
        .eq("user_id", user.id)
        .order("decision_date", { ascending: false });

      if (error) throw error;
      return data as WinLossRecord[];
    },
    enabled: !!user,
  });
}

export function useAddWinLossRecord() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<WinLossRecord>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("win_loss_records")
        .insert({
          user_id: user.id,
          opportunity_id: record.opportunity_id,
          opportunity_title: record.opportunity_title!,
          agency: record.agency,
          outcome: record.outcome!,
          award_amount: record.award_amount,
          bid_amount: record.bid_amount,
          winner_name: record.winner_name,
          winner_uei: record.winner_uei,
          loss_reason: record.loss_reason,
          lessons_learned: record.lessons_learned,
          bid_date: record.bid_date,
          decision_date: record.decision_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["win-loss-records"] });
      toast({ title: "Record added", description: "Win/loss record saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateWinLossRecord() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WinLossRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("win_loss_records")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["win-loss-records"] });
      toast({ title: "Record updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteWinLossRecord() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("win_loss_records")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["win-loss-records"] });
      toast({ title: "Record deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// USAspending search hook
export function useUSAspendingSearch() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ action, params }: { action: string; params: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke("usaspending-search", {
        body: { action, params },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({ title: "Search error", description: error.message, variant: "destructive" });
    },
  });
}
