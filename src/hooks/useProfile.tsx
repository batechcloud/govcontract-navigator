import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean | null;
  is_suspended: boolean | null;
  last_active_at: string | null;
  notification_preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  naics_codes: string[] | null;
  certifications: string[] | null;
  capabilities: string[] | null;
  contract_types: string[] | null;
  preferred_agencies: string[] | null;
  min_contract_value: string | null;
  max_contract_value: string | null;
  sam_uei: string | null;
  cage_code: string | null;
  duns_number: string | null;
  year_founded: number | null;
  employee_count: string | null;
  annual_revenue: string | null;
  past_performance: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
  });
};

export const useCompanyProfile = () => {
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CompanyProfile | null;
    },
  });
};
