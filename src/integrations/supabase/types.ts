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
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          instagram_username: string | null
          last_club_id: string | null
          last_name: string | null
          last_sport: string | null
          last_team_id: string | null
          remember_last_selection: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          instagram_username?: string | null
          last_club_id?: string | null
          last_name?: string | null
          last_sport?: string | null
          last_team_id?: string | null
          remember_last_selection?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          instagram_username?: string | null
          last_club_id?: string | null
          last_name?: string | null
          last_sport?: string | null
          last_team_id?: string | null
          remember_last_selection?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          can_upload_logos: boolean
          can_use_custom_templates: boolean
          created_at: string
          max_custom_templates: number
          max_games_per_template: number
          max_teams: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          can_upload_logos?: boolean
          can_use_custom_templates?: boolean
          created_at?: string
          max_custom_templates: number
          max_games_per_template: number
          max_teams: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          can_upload_logos?: boolean
          can_use_custom_templates?: boolean
          created_at?: string
          max_custom_templates?: number
          max_games_per_template?: number
          max_teams?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          id: string
          name: string
          supported_games: number
          svg_config: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          supported_games?: number
          svg_config: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          supported_games?: number
          svg_config?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_logos: {
        Row: {
          created_at: string
          file_path: string
          file_url: string | null
          id: string
          logo_type: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_url?: string | null
          id?: string
          logo_type?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_url?: string | null
          id?: string
          logo_type?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          created_at: string
          id: string
          stripe_customer_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_team_slots: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          last_changed_at: string
          sport: string | null
          team_id: string
          team_name: string | null
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          last_changed_at?: string
          sport?: string | null
          team_id: string
          team_name?: string | null
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          last_changed_at?: string
          sport?: string | null
          team_id?: string
          team_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_team_slot: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_change_team_slot: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "free_user" | "paid_user" | "admin"
      subscription_tier: "free" | "amateur" | "pro" | "premium"
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
      app_role: ["free_user", "paid_user", "admin"],
      subscription_tier: ["free", "amateur", "pro", "premium"],
    },
  },
} as const
