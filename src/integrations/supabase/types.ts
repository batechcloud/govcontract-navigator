export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      company_profiles: {
        Row: {
          annual_revenue: string | null
          cage_code: string | null
          capabilities: string[] | null
          certifications: string[] | null
          company_name: string
          contract_types: string[] | null
          created_at: string
          duns_number: string | null
          employee_count: string | null
          id: string
          max_contract_value: string | null
          min_contract_value: string | null
          naics_codes: string[] | null
          past_performance: Json | null
          preferred_agencies: string[] | null
          sam_uei: string | null
          updated_at: string
          user_id: string
          year_founded: number | null
        }
        Insert: {
          annual_revenue?: string | null
          cage_code?: string | null
          capabilities?: string[] | null
          certifications?: string[] | null
          company_name: string
          contract_types?: string[] | null
          created_at?: string
          duns_number?: string | null
          employee_count?: string | null
          id?: string
          max_contract_value?: string | null
          min_contract_value?: string | null
          naics_codes?: string[] | null
          past_performance?: Json | null
          preferred_agencies?: string[] | null
          sam_uei?: string | null
          updated_at?: string
          user_id: string
          year_founded?: number | null
        }
        Update: {
          annual_revenue?: string | null
          cage_code?: string | null
          capabilities?: string[] | null
          certifications?: string[] | null
          company_name?: string
          contract_types?: string[] | null
          created_at?: string
          duns_number?: string | null
          employee_count?: string | null
          id?: string
          max_contract_value?: string | null
          min_contract_value?: string | null
          naics_codes?: string[] | null
          past_performance?: Json | null
          preferred_agencies?: string[] | null
          sam_uei?: string | null
          updated_at?: string
          user_id?: string
          year_founded?: number | null
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          period_end: string | null
          period_start: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          feature_type: string
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          feature_type?: string
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          feature_type?: string
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          is_enabled: boolean | null
          plan_id: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          is_enabled?: boolean | null
          plan_id: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          is_enabled?: boolean | null
          plan_id?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          is_suspended: boolean | null
          last_active_at: string | null
          last_name: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          is_suspended?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          last_run_at: string | null
          name: string
          query: string
          result_count: number | null
          search_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name: string
          query: string
          result_count?: number | null
          search_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name?: string
          query?: string
          result_count?: number | null
          search_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          monthly_price: number
          name: string
          sort_order: number | null
          updated_at: string | null
          yearly_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name: string
          sort_order?: number | null
          updated_at?: string | null
          yearly_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          yearly_price?: number
        }
        Relationships: []
      }
      tracked_contracts: {
        Row: {
          contract_agency: string | null
          contract_id: string
          contract_title: string
          contract_value: string | null
          created_at: string
          id: string
          match_score: number | null
          naics_code: string | null
          notes: string | null
          posted_date: string | null
          priority: string | null
          response_deadline: string | null
          set_aside: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_agency?: string | null
          contract_id: string
          contract_title: string
          contract_value?: string | null
          created_at?: string
          id?: string
          match_score?: number | null
          naics_code?: string | null
          notes?: string | null
          posted_date?: string | null
          priority?: string | null
          response_deadline?: string | null
          set_aside?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_agency?: string | null
          contract_id?: string
          contract_title?: string
          contract_value?: string | null
          created_at?: string
          id?: string
          match_score?: number | null
          naics_code?: string | null
          notes?: string | null
          posted_date?: string | null
          priority?: string | null
          response_deadline?: string | null
          set_aside?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feature_overrides: {
        Row: {
          created_at: string | null
          expires_at: string | null
          feature_id: string
          granted_by: string | null
          id: string
          is_enabled: boolean
          reason: string | null
          usage_limit_override: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          feature_id: string
          granted_by?: string | null
          id?: string
          is_enabled: boolean
          reason?: string | null
          usage_limit_override?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          feature_id?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          reason?: string | null
          usage_limit_override?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feature_overrides_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_feature_access: {
        Args: { _feature_code: string; _user_id: string }
        Returns: {
          current_usage: number
          has_access: boolean
          is_override: boolean
          usage_limit: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_feature_usage: {
        Args: { _feature_code: string; _increment?: number; _user_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "superadmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "superadmin"],
    },
  },
} as const
