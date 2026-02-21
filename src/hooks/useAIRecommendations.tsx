import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export function useAIRecommendations() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: async (): Promise<{ recommendations: AIRecommendation[]; message?: string; error?: string }> => {
      const { data, error } = await supabase.functions.invoke("ai-recommend-contracts");

      if (error) throw error;
      if (data?.error === "no_profile") return { recommendations: [], message: data.message };
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!session,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}
