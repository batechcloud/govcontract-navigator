import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractScoreInput {
  title: string;
  agency?: string;
  value?: string;
  setAside?: string;
  naicsCode?: string;
  deadline?: string;
  type?: string;
  description?: string;
}

export interface ContractScoreResult {
  score: number;
  recommendation: "Bid" | "No-Bid" | "Consider";
  reasoning: string;
  strengths: string[];
  gaps: string[];
  tips: string[];
}

export function useWinProbability() {
  return useMutation({
    mutationFn: async (contract: ContractScoreInput): Promise<ContractScoreResult> => {
      const { data, error } = await supabase.functions.invoke("ai-contract-score", {
        body: { contract },
      });

      if (error) {
        if (error.message?.includes("429")) {
          throw new Error("AI is busy, please try again in a moment.");
        }
        throw error;
      }

      if (data?.error) throw new Error(data.error);
      return data as ContractScoreResult;
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to score contract");
    },
  });
}
