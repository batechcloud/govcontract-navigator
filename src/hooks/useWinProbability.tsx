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

async function invokeWithRetry(contract: ContractScoreInput, maxRetries = 4): Promise<ContractScoreResult> {
  let delay = 1500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke("ai-contract-score", {
      body: { contract },
    });

    const is429 = error?.message?.includes("429") || data?.error?.includes("busy");

    if (is429 && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as ContractScoreResult;
  }

  throw new Error("AI service is temporarily unavailable. Please try again shortly.");
}

export function useWinProbability() {
  return useMutation({
    mutationFn: (contract: ContractScoreInput) => invokeWithRetry(contract),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to score contract");
    },
  });
}
