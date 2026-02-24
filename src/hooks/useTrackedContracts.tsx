import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrackedContract {
  id: string;
  user_id: string;
  contract_id: string;
  contract_title: string;
  contract_agency: string | null;
  response_deadline: string | null;
  status: string;
  priority: string;
  notes: string | null;
  match_score: number | null;
  posted_date: string | null;
  contract_value: string | null;
  set_aside: string | null;
  naics_code: string | null;
  resource_links: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useTrackedContracts = () => {
  return useQuery({
    queryKey: ["tracked-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrackedContract[];
    },
  });
};

export const useTrackContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: Omit<TrackedContract, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tracked_contracts")
        .upsert({
          ...contract,
          user_id: user.id,
        }, {
          onConflict: "user_id,contract_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-contracts"] });
      toast.success("Contract tracked", {
        description: "This opportunity has been added to your tracked contracts.",
      });
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });
};

export const useUntrackContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from("tracked_contracts")
        .delete()
        .eq("id", contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-contracts"] });
      toast.success("Contract removed", {
        description: "This opportunity has been removed from tracking.",
      });
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });
};

export const useUpdateContractStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("tracked_contracts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-contracts"] });
      toast.success("Status updated", {
        description: "Contract status has been updated.",
      });
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });
};

export const useUpdateContractNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes, priority }: { id: string; notes: string; priority?: string }) => {
      const updates: Record<string, string> = { notes, updated_at: new Date().toISOString() };
      if (priority) updates.priority = priority;
      const { data, error } = await supabase
        .from("tracked_contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-contracts"] });
      toast.success("Saved", { description: "Contract details have been updated." });
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });
};