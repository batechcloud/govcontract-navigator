import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

async function invokeWithRetry(maxRetries = 4): Promise<{ recommendations: AIRecommendation[]; message?: string; error?: string; source?: string }> {
  let delay = 1500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke("ai-recommend-contracts");

    const is429 = error?.message?.includes("429") || data?.error?.includes("busy");

    if (is429 && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }

    if (error) throw error;
    if (data?.error === "no_profile") return { recommendations: [], message: data.message };
    if (data?.error) throw new Error(data.error);
    return data;
  }

  throw new Error("AI service is temporarily unavailable. Please try again shortly.");
}

export function useAIRecommendations() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: () => invokeWithRetry(),
    enabled: !!session,
    staleTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 5000,
  });
}
