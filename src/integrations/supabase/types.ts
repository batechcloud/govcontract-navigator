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
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_name: string
          created_at: string | null
          id: string
          request_count: number
          request_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_name?: string
          created_at?: string | null
          id?: string
          request_count?: number
          request_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_name?: string
          created_at?: string | null
          id?: string
          request_count?: number
          request_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cached_contracts: {
        Row: {
          agency: string | null
          contract_id: string
          contract_type: string | null
          created_at: string
          deadline: string | null
          description: string | null
          fetched_at: string
          id: string
          location: string | null
          match_score: number | null
          naics_code: string | null
          posted_date: string | null
          raw_data: Json | null
          resource_links: string[] | null
          sector: string | null
          set_aside: string | null
          solicitation_number: string | null
          source: string | null
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          agency?: string | null
          contract_id: string
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          fetched_at?: string
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          posted_date?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          sector?: string | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          agency?: string | null
          contract_id?: string
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          fetched_at?: string
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          posted_date?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          sector?: string | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          psc_codes: string[] | null
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
          psc_codes?: string[] | null
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
          psc_codes?: string[] | null
          sam_uei?: string | null
          updated_at?: string
          user_id?: string
          year_founded?: number | null
        }
        Relationships: []
      }
      competitor_awards: {
        Row: {
          award_amount: number | null
          award_date: string | null
          award_description: string | null
          award_id: string
          awarding_agency: string | null
          created_at: string | null
          id: string
          naics_code: string | null
          place_of_performance: string | null
          psc_code: string | null
          tracked_competitor_id: string
          user_id: string
        }
        Insert: {
          award_amount?: number | null
          award_date?: string | null
          award_description?: string | null
          award_id: string
          awarding_agency?: string | null
          created_at?: string | null
          id?: string
          naics_code?: string | null
          place_of_performance?: string | null
          psc_code?: string | null
          tracked_competitor_id: string
          user_id: string
        }
        Update: {
          award_amount?: number | null
          award_date?: string | null
          award_description?: string | null
          award_id?: string
          awarding_agency?: string | null
          created_at?: string | null
          id?: string
          naics_code?: string | null
          place_of_performance?: string | null
          psc_code?: string | null
          tracked_competitor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_awards_tracked_competitor_id_fkey"
            columns: ["tracked_competitor_id"]
            isOneToOne: false
            referencedRelation: "tracked_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_summaries: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          summary: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          summary: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          agency: string | null
          contract_id: string
          contract_type: string | null
          created_at: string
          deadline: string | null
          description: string | null
          fetched_at: string
          id: string
          location: string | null
          match_score: number | null
          naics_code: string | null
          parent_agency: string | null
          posted_date: string | null
          psc_code: string | null
          raw_data: Json | null
          resource_links: string[] | null
          sector: string | null
          set_aside: string | null
          solicitation_number: string | null
          source: string | null
          title: string | null
          updated_at: string
          url: string | null
          value: number | null
        }
        Insert: {
          agency?: string | null
          contract_id: string
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          fetched_at?: string
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          sector?: string | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          value?: number | null
        }
        Update: {
          agency?: string | null
          contract_id?: string
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          fetched_at?: string
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          sector?: string | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          value?: number | null
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
      proposals: {
        Row: {
          agency: string | null
          ai_generated_at: string | null
          created_at: string
          executive_summary: string | null
          id: string
          management_plan: string | null
          match_score: number | null
          opportunity_id: string
          opportunity_title: string
          past_performance: string | null
          pricing_notes: string | null
          status: string
          technical_approach: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency?: string | null
          ai_generated_at?: string | null
          created_at?: string
          executive_summary?: string | null
          id?: string
          management_plan?: string | null
          match_score?: number | null
          opportunity_id: string
          opportunity_title: string
          past_performance?: string | null
          pricing_notes?: string | null
          status?: string
          technical_approach?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency?: string | null
          ai_generated_at?: string | null
          created_at?: string
          executive_summary?: string | null
          id?: string
          management_plan?: string | null
          match_score?: number | null
          opportunity_id?: string
          opportunity_title?: string
          past_performance?: string | null
          pricing_notes?: string | null
          status?: string
          technical_approach?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sam_opportunities: {
        Row: {
          agency: string | null
          contract_type: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          location: string | null
          match_score: number | null
          naics_code: string | null
          notice_id: string
          office: string | null
          parent_agency: string | null
          posted_date: string | null
          psc_code: string | null
          raw: Json | null
          resource_links: string[] | null
          set_aside: string | null
          solicitation_number: string | null
          sub_agency: string | null
          synced_at: string
          title: string | null
          updated_at: string
          url: string | null
          value: number | null
        }
        Insert: {
          agency?: string | null
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          notice_id: string
          office?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw?: Json | null
          resource_links?: string[] | null
          set_aside?: string | null
          solicitation_number?: string | null
          sub_agency?: string | null
          synced_at?: string
          title?: string | null
          updated_at?: string
          url?: string | null
          value?: number | null
        }
        Update: {
          agency?: string | null
          contract_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          notice_id?: string
          office?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw?: Json | null
          resource_links?: string[] | null
          set_aside?: string | null
          solicitation_number?: string | null
          sub_agency?: string | null
          synced_at?: string
          title?: string | null
          updated_at?: string
          url?: string | null
          value?: number | null
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
      support_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["support_sender_type"]
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["support_sender_type"]
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["support_sender_type"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          status: Database["public"]["Enums"]["support_thread_status"]
          subject: string
          unread_for_admin: number
          unread_for_workspace: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: Database["public"]["Enums"]["support_thread_status"]
          subject?: string
          unread_for_admin?: number
          unread_for_workspace?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: Database["public"]["Enums"]["support_thread_status"]
          subject?: string
          unread_for_admin?: number
          unread_for_workspace?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: []
      }
      sync_cursors: {
        Row: {
          last_run_id: string | null
          last_synced_at: string | null
          source: string
          updated_at: string
        }
        Insert: {
          last_run_id?: string | null
          last_synced_at?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          last_run_id?: string | null
          last_synced_at?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_failed_records: {
        Row: {
          attempts: number
          contract_id: string | null
          created_at: string
          error: string | null
          id: string
          job_id: string | null
          payload: Json | null
          resolved: boolean
        }
        Insert: {
          attempts?: number
          contract_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
          resolved?: boolean
        }
        Update: {
          attempts?: number
          contract_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sync_failed_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          cancel_requested: boolean
          checkpoint: Json
          created_at: string
          current_offset: number
          finished_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["sync_job_type"]
          last_error: string | null
          posted_from: string | null
          posted_to: string | null
          records_failed: number
          records_inserted: number
          records_updated: number
          started_at: string
          status: Database["public"]["Enums"]["sync_job_status"]
          total_records: number | null
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          cancel_requested?: boolean
          checkpoint?: Json
          created_at?: string
          current_offset?: number
          finished_at?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["sync_job_type"]
          last_error?: string | null
          posted_from?: string | null
          posted_to?: string | null
          records_failed?: number
          records_inserted?: number
          records_updated?: number
          started_at?: string
          status?: Database["public"]["Enums"]["sync_job_status"]
          total_records?: number | null
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          cancel_requested?: boolean
          checkpoint?: Json
          created_at?: string
          current_offset?: number
          finished_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["sync_job_type"]
          last_error?: string | null
          posted_from?: string | null
          posted_to?: string | null
          records_failed?: number
          records_inserted?: number
          records_updated?: number
          started_at?: string
          status?: Database["public"]["Enums"]["sync_job_status"]
          total_records?: number | null
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_metadata: {
        Row: {
          id: string
          last_posted_date: string | null
          last_synced_at: string
          total_synced: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          last_posted_date?: string | null
          last_synced_at?: string
          total_synced?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          last_posted_date?: string | null
          last_synced_at?: string
          total_synced?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          finished_at: string | null
          id: string
          last_error: string | null
          manual: boolean
          pages: number
          records_fetched: number
          records_inserted: number
          records_updated: number
          source: string
          started_at: string
          status: string
          triggered_by: string | null
          window_from: string | null
          window_to: string | null
        }
        Insert: {
          finished_at?: string | null
          id?: string
          last_error?: string | null
          manual?: boolean
          pages?: number
          records_fetched?: number
          records_inserted?: number
          records_updated?: number
          source: string
          started_at?: string
          status?: string
          triggered_by?: string | null
          window_from?: string | null
          window_to?: string | null
        }
        Update: {
          finished_at?: string | null
          id?: string
          last_error?: string | null
          manual?: boolean
          pages?: number
          records_fetched?: number
          records_inserted?: number
          records_updated?: number
          source?: string
          started_at?: string
          status?: string
          triggered_by?: string | null
          window_from?: string | null
          window_to?: string | null
        }
        Relationships: []
      }
      tracked_competitors: {
        Row: {
          competitor_cage: string | null
          competitor_name: string
          competitor_uei: string | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          naics_codes: string[] | null
          notes: string | null
          total_awards: number | null
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competitor_cage?: string | null
          competitor_name: string
          competitor_uei?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          naics_codes?: string[] | null
          notes?: string | null
          total_awards?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competitor_cage?: string | null
          competitor_name?: string
          competitor_uei?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          naics_codes?: string[] | null
          notes?: string | null
          total_awards?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
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
          resource_links: string[] | null
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
          resource_links?: string[] | null
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
          resource_links?: string[] | null
          response_deadline?: string | null
          set_aside?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usaspending_awards: {
        Row: {
          award_amount: number | null
          award_id: string
          award_type: string | null
          award_type_code: string | null
          awarding_agency: string | null
          awarding_sub_agency: string | null
          base_obligation: number | null
          created_at: string
          date_signed: string | null
          description: string | null
          funding_agency: string | null
          generated_internal_id: string | null
          id: string
          naics_code: string | null
          period_of_performance_end: string | null
          period_of_performance_start: string | null
          place_of_performance_city: string | null
          place_of_performance_country: string | null
          place_of_performance_state: string | null
          psc_code: string | null
          raw: Json | null
          recipient_duns: string | null
          recipient_name: string | null
          recipient_uei: string | null
          set_aside: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          award_amount?: number | null
          award_id: string
          award_type?: string | null
          award_type_code?: string | null
          awarding_agency?: string | null
          awarding_sub_agency?: string | null
          base_obligation?: number | null
          created_at?: string
          date_signed?: string | null
          description?: string | null
          funding_agency?: string | null
          generated_internal_id?: string | null
          id?: string
          naics_code?: string | null
          period_of_performance_end?: string | null
          period_of_performance_start?: string | null
          place_of_performance_city?: string | null
          place_of_performance_country?: string | null
          place_of_performance_state?: string | null
          psc_code?: string | null
          raw?: Json | null
          recipient_duns?: string | null
          recipient_name?: string | null
          recipient_uei?: string | null
          set_aside?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          award_amount?: number | null
          award_id?: string
          award_type?: string | null
          award_type_code?: string | null
          awarding_agency?: string | null
          awarding_sub_agency?: string | null
          base_obligation?: number | null
          created_at?: string
          date_signed?: string | null
          description?: string | null
          funding_agency?: string | null
          generated_internal_id?: string | null
          id?: string
          naics_code?: string | null
          period_of_performance_end?: string | null
          period_of_performance_start?: string | null
          place_of_performance_city?: string | null
          place_of_performance_country?: string | null
          place_of_performance_state?: string | null
          psc_code?: string | null
          raw?: Json | null
          recipient_duns?: string | null
          recipient_name?: string | null
          recipient_uei?: string | null
          set_aside?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
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
      win_loss_records: {
        Row: {
          agency: string | null
          award_amount: number | null
          bid_amount: number | null
          bid_date: string | null
          created_at: string | null
          decision_date: string | null
          id: string
          lessons_learned: string | null
          loss_reason: string | null
          opportunity_id: string | null
          opportunity_title: string
          outcome: string
          updated_at: string | null
          user_id: string
          winner_name: string | null
          winner_uei: string | null
        }
        Insert: {
          agency?: string | null
          award_amount?: number | null
          bid_amount?: number | null
          bid_date?: string | null
          created_at?: string | null
          decision_date?: string | null
          id?: string
          lessons_learned?: string | null
          loss_reason?: string | null
          opportunity_id?: string | null
          opportunity_title: string
          outcome: string
          updated_at?: string | null
          user_id: string
          winner_name?: string | null
          winner_uei?: string | null
        }
        Update: {
          agency?: string | null
          award_amount?: number | null
          bid_amount?: number | null
          bid_date?: string | null
          created_at?: string | null
          decision_date?: string | null
          id?: string
          lessons_learned?: string | null
          loss_reason?: string | null
          opportunity_id?: string | null
          opportunity_title?: string
          outcome?: string
          updated_at?: string | null
          user_id?: string
          winner_name?: string | null
          winner_uei?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      sam_opportunities_compat: {
        Row: {
          agency: string | null
          contract_id: string | null
          contract_type: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          fetched_at: string | null
          id: string | null
          location: string | null
          match_score: number | null
          naics_code: string | null
          parent_agency: string | null
          posted_date: string | null
          psc_code: string | null
          raw_data: Json | null
          resource_links: string[] | null
          set_aside: string | null
          solicitation_number: string | null
          source: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          value: number | null
        }
        Insert: {
          agency?: string | null
          contract_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          fetched_at?: string | null
          id?: string | null
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: never
          title?: string | null
          updated_at?: string | null
          url?: string | null
          value?: number | null
        }
        Update: {
          agency?: string | null
          contract_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          fetched_at?: string | null
          id?: string | null
          location?: string | null
          match_score?: number | null
          naics_code?: string | null
          parent_agency?: string | null
          posted_date?: string | null
          psc_code?: string | null
          raw_data?: Json | null
          resource_links?: string[] | null
          set_aside?: string | null
          solicitation_number?: string | null
          source?: never
          title?: string | null
          updated_at?: string | null
          url?: string | null
          value?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_subscriptions: {
        Args: never
        Returns: {
          created_at: string
          current_period_end: string
          current_period_start: string
          email: string
          monthly_price: number
          plan_name: string
          status: string
          subscription_id: string
          user_id: string
          yearly_price: number
        }[]
      }
      admin_list_team: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          last_active_at: string
          last_name: string
          role: string
          user_id: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          is_suspended: boolean
          last_active_at: string
          last_name: string
          plan_name: string
          role: Database["public"]["Enums"]["workspace_role"]
          subscription_status: string
          user_id: string
          workspace_id: string
          workspace_name: string
        }[]
      }
      admin_list_workspace_members: {
        Args: { _workspace_id: string }
        Returns: {
          email: string
          first_name: string
          is_suspended: boolean
          joined_at: string
          last_active_at: string
          last_name: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
        }[]
      }
      admin_list_workspaces: {
        Args: never
        Returns: {
          is_suspended: boolean
          member_count: number
          owner_email: string
          owner_first_name: string
          owner_id: string
          owner_last_active_at: string
          owner_last_name: string
          plan_name: string
          workspace_created_at: string
          workspace_id: string
          workspace_name: string
        }[]
      }
      admin_overview_stats: {
        Args: never
        Returns: {
          active_subscriptions: number
          cancellations_30d: number
          failed_sync_records: number
          last_sync_at: string
          mrr_cents: number
          open_support_threads: number
          signups_30d: number
          signups_7d: number
          signups_today: number
          suspended_users: number
          total_users: number
          total_workspaces: number
        }[]
      }
      admin_recent_signups: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          first_name: string
          id: string
          is_suspended: boolean
          last_name: string
        }[]
      }
      admin_signups_timeseries: {
        Args: { _days?: number }
        Returns: {
          day: string
          signups: number
        }[]
      }
      admin_workspace_detail: { Args: { _workspace_id: string }; Returns: Json }
      can_impersonate: { Args: { _user_id: string }; Returns: boolean }
      can_manage_subscriptions: { Args: { _user_id: string }; Returns: boolean }
      check_and_increment_rate_limit: {
        Args: { _api_name: string; _daily_limit: number; _user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          daily_limit: number
        }[]
      }
      check_feature_access: {
        Args: { _feature_code: string; _user_id: string }
        Returns: {
          current_usage: number
          has_access: boolean
          is_override: boolean
          usage_limit: number
        }[]
      }
      delete_user_cascade: { Args: { _user_id: string }; Returns: undefined }
      get_or_create_support_thread: { Args: never; Returns: string }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_editor: { Args: never; Returns: boolean }
      is_workspace_owner: { Args: { _workspace_id: string }; Returns: boolean }
      my_workspace_id: { Args: never; Returns: string }
      same_workspace_as: { Args: { _other_user: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "superadmin"
        | "subscription_manager"
        | "workspace_admin"
      support_sender_type: "workspace" | "admin" | "system"
      support_thread_status: "open" | "pending" | "resolved"
      sync_job_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      sync_job_type: "full" | "incremental" | "manual"
      workspace_role: "owner" | "member" | "viewer" | "editor"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "superadmin",
        "subscription_manager",
        "workspace_admin",
      ],
      support_sender_type: ["workspace", "admin", "system"],
      support_thread_status: ["open", "pending", "resolved"],
      sync_job_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      sync_job_type: ["full", "incremental", "manual"],
      workspace_role: ["owner", "member", "viewer", "editor"],
    },
  },
} as const
