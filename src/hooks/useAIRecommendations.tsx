import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { enqueueAIRequest } from "@/lib/ai-request-queue";

export interface AIRecommendation {
  id: string;
  title: string;
  agency: string;
  value: string;
  deadline: string | null;
  setAside: string;
  naicsCode: string | null;
  type: string;
  link: string;
  match_reason: string;
  priority: "high" | "medium" | "low";
}

async function invokeWithRetry(maxRetries = 3): Promise<{ recommendations: AIRecommendation[]; message?: string; error?: string; source?: string }> {
  // Exponential backoff with full jitter: base * 2^attempt, randomized in [0, capped]
  const baseDelay = 1000;
  const maxDelay = 15000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke("ai-recommend-contracts");

    const is429 =
      error?.message?.includes("429") ||
      (error as any)?.context?.status === 429 ||
      (typeof data?.error === "string" && data.error.toLowerCase().includes("busy"));

    if (is429 && attempt < maxRetries) {
      const expDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
      const jittered = Math.random() * expDelay; // full jitter
      await new Promise(r => setTimeout(r, jittered));
      continue;
    }

    // Persistent 429 → degrade gracefully so the card doesn't blank-screen.
    if (is429) {
      return {
        recommendations: [],
        message: "AI picks are temporarily busy. Please refresh in a moment.",
      };
    }

    if (error) throw error;
    if (data?.error === "no_profile") return { recommendations: [], message: data.message };
    if (data?.error) throw new Error(data.error);
    return data;
  }

  return {
    recommendations: [],
    message: "AI picks are temporarily unavailable. Please try again shortly.",
  };
}

export function useAIRecommendations() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: () =>
      enqueueAIRequest(
        "ai-recommend-contracts",
        () => invokeWithRetry(),
        { minGapMs: 800, dedupeId: "ai-recommend-contracts" },
      ),
    enabled: !!session,
    staleTime: 30 * 60 * 1000,
    // invokeWithRetry already handles 429 backoff — don't double-retry.
    retry: 0,
  });
}
