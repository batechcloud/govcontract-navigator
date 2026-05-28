import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProfileSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ProfileScoreResult {
  score: number;
  summary?: string;
  suggestions: ProfileSuggestion[];
  fallback?: boolean;
  busy?: boolean;
}

const BUSY_FALLBACK: ProfileScoreResult = {
  score: 0,
  summary: "AI scoring is temporarily busy. Try again shortly.",
  suggestions: [],
  fallback: true,
  busy: true,
};

export function useAIProfileScore() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-profile-score"],
    queryFn: async (): Promise<ProfileScoreResult> => {
      const { data, error } = await supabase.functions.invoke("ai-profile-optimizer");

      // Treat 429s / network errors as a soft busy state — never blank the page.
      if (error) {
        const is429 = error.message?.includes("429") || (error as any)?.context?.status === 429;
        if (is429) return BUSY_FALLBACK;
        console.error("ai-profile-score error:", error);
        return BUSY_FALLBACK;
      }
      if (data?.error) {
        if (String(data.error).toLowerCase().includes("busy")) return BUSY_FALLBACK;
        throw new Error(data.error);
      }
      return data as ProfileScoreResult;
    },
    enabled: !!session,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}
