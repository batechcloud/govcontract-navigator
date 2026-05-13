import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ProfileSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ProfileScoreResult {
  score: number;
  summary?: string;
  suggestions: ProfileSuggestion[];
}

export function useAIProfileScore() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-profile-score"],
    queryFn: async (): Promise<ProfileScoreResult> => {
      const { data, error } = await supabase.functions.invoke("ai-profile-optimizer");

      if (error) {
        // Check for rate limit in the error response
        if (error.message?.includes("429")) {
          toast.error("AI is busy, please try again in a moment.");
          throw new Error("rate_limited");
        }
        throw error;
      }
      if (data?.error) {
        if (data.error.includes("busy")) {
          toast.error("AI is busy, please try again in a moment.");
          throw new Error("rate_limited");
        }
        throw new Error(data.error);
      }
      return data as ProfileScoreResult;
    },
    enabled: !!session,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}
