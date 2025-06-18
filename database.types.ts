export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_community_posts_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          profile_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          profile_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant1_id: string
          participant2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant1_id: string
          participant2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant1_id?: string
          participant2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      daily_notes: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          date: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_notes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          category_code: string
          comment: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_completed: boolean
          linked_weekly_task_id: string | null
          plan_date: string
          profile_id: string
          subcode: string | null
          updated_at: string
        }
        Insert: {
          category_code: string
          comment?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean
          linked_weekly_task_id?: string | null
          plan_date: string
          profile_id: string
          subcode?: string | null
          updated_at?: string
        }
        Update: {
          category_code?: string
          comment?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean
          linked_weekly_task_id?: string | null
          plan_date?: string
          profile_id?: string
          subcode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      daily_records: {
        Row: {
          category_code: string
          comment: string | null
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          is_public: boolean
          linked_plan_id: string | null
          profile_id: string
          subcode: string | null
          updated_at: string
        }
        Insert: {
          category_code: string
          comment?: string | null
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          is_public?: boolean
          linked_plan_id?: string | null
          profile_id: string
          subcode?: string | null
          updated_at?: string
        }
        Update: {
          category_code?: string
          comment?: string | null
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          is_public?: boolean
          linked_plan_id?: string | null
          profile_id?: string
          subcode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_records_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string | null
          following_id: string | null
        }
        Insert: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
        }
        Update: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_profiles_profile_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_profile_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      memos: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string
          record_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id: string
          record_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
          record_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memos_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "memos_record_id_daily_records_id_fk"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "daily_records"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_profiles_profile_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          category_code: string
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          month_date: string
          profile_id: string
          success_criteria: Json | null
          title: string
          updated_at: string
          weekly_breakdown: Json | null
        }
        Insert: {
          category_code: string
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          month_date: string
          profile_id: string
          success_criteria?: Json | null
          title: string
          updated_at?: string
          weekly_breakdown?: Json | null
        }
        Update: {
          category_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          month_date?: string
          profile_id?: string
          success_criteria?: Json | null
          title?: string
          updated_at?: string
          weekly_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      monthly_reflections: {
        Row: {
          created_at: string
          id: string
          month_date: string
          monthly_notes: string | null
          monthly_reflection: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_date: string
          monthly_notes?: string | null
          monthly_reflection?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month_date?: string
          monthly_notes?: string | null
          monthly_reflection?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reflections_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_id: string
          resource_url: string | null
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_id: string
          resource_url?: string | null
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string
          resource_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_profiles_profile_id_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_profiles_profile_id_fk"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_record_visibility: string
          full_name: string
          headline: string | null
          profile_id: string
          stats: Json | null
          updated_at: string
          username: string
          views: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_record_visibility?: string
          full_name: string
          headline?: string | null
          profile_id: string
          stats?: Json | null
          updated_at?: string
          username: string
          views?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_record_visibility?: string
          full_name?: string
          headline?: string | null
          profile_id?: string
          stats?: Json | null
          updated_at?: string
          username?: string
          views?: Json | null
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          page_type: string
          period: string
          profile_id: string
          settings: Json | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          page_type: string
          period: string
          profile_id: string
          settings?: Json | null
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          page_type?: string
          period?: string
          profile_id?: string
          settings?: Json | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      stats_cache: {
        Row: {
          activity_heatmap: Json | null
          category_distribution: Json | null
          created_at: string
          id: string
          month_date: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          activity_heatmap?: Json | null
          category_distribution?: Json | null
          created_at?: string
          id: string
          month_date: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          activity_heatmap?: Json | null
          category_distribution?: Json | null
          created_at?: string
          id?: string
          month_date?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          profile_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          profile_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          profile_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_categories_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_code_settings: {
        Row: {
          created_at: string
          enable_autocomplete: boolean
          enable_recommendation: boolean
          id: string
          profile_id: string
          recommendation_source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enable_autocomplete?: boolean
          enable_recommendation?: boolean
          id?: string
          profile_id: string
          recommendation_source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enable_autocomplete?: boolean
          enable_recommendation?: boolean
          id?: string
          profile_id?: string
          recommendation_source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_code_settings_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_default_code_preferences: {
        Row: {
          created_at: string
          default_category_code: string
          id: string
          is_active: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_category_code: string
          id?: string
          is_active?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_category_code?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_default_code_preferences_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_subcodes: {
        Row: {
          created_at: string
          description: string | null
          frequency_score: number
          id: string
          is_favorite: boolean
          parent_category_code: string
          profile_id: string
          subcode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency_score?: number
          id?: string
          is_favorite?: boolean
          parent_category_code: string
          profile_id: string
          subcode: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency_score?: number
          id?: string
          is_favorite?: boolean
          parent_category_code?: string
          profile_id?: string
          subcode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subcodes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      weekly_notes: {
        Row: {
          created_at: string
          critical_success_factor: string | null
          id: string
          profile_id: string
          updated_at: string
          week_start_date: string
          weekly_goal_note: string | null
          weekly_see: string | null
          words_of_praise: string | null
        }
        Insert: {
          created_at?: string
          critical_success_factor?: string | null
          id?: string
          profile_id: string
          updated_at?: string
          week_start_date: string
          weekly_goal_note?: string | null
          weekly_see?: string | null
          words_of_praise?: string | null
        }
        Update: {
          created_at?: string
          critical_success_factor?: string | null
          id?: string
          profile_id?: string
          updated_at?: string
          week_start_date?: string
          weekly_goal_note?: string | null
          weekly_see?: string | null
          words_of_praise?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_notes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      weekly_tasks: {
        Row: {
          category_code: string
          comment: string
          created_at: string
          days: Json | null
          from_monthly_goal_id: string | null
          id: string
          is_locked: boolean
          profile_id: string
          sort_order: number
          subcode: string | null
          updated_at: string
          week_start_date: string
        }
        Insert: {
          category_code: string
          comment: string
          created_at?: string
          days?: Json | null
          from_monthly_goal_id?: string | null
          id?: string
          is_locked?: boolean
          profile_id: string
          sort_order?: number
          subcode?: string | null
          updated_at?: string
          week_start_date: string
        }
        Update: {
          category_code?: string
          comment?: string
          created_at?: string
          days?: Json | null
          from_monthly_goal_id?: string | null
          id?: string
          is_locked?: boolean
          profile_id?: string
          sort_order?: number
          subcode?: string | null
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_tasks_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
