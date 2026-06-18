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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          id: string
          message: string | null
          trip_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          trip_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          trip_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      favourite_routes: {
        Row: {
          created_at: string
          from_location: string
          id: string
          label: string | null
          last_used_at: string
          to_location: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          from_location: string
          id?: string
          label?: string | null
          last_used_at?: string
          to_location: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          from_location?: string
          id?: string
          label?: string | null
          last_used_at?: string
          to_location?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string
          definition: string
          id: string
          term: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition: string
          id?: string
          term: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string
          id?: string
          term?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          address_text: string
          created_at: string
          id: string
          label: string
          lat: number | null
          lng: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_text: string
          created_at?: string
          id?: string
          label: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_text?: string
          created_at?: string
          id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_log: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          avoid_hills: boolean
          confidence_level: number
          created_at: string
          home_destination: string | null
          id: string
          late_night_default: boolean
          low_data_mode: boolean
          low_walking: boolean
          onboarded: boolean
          route_priority: string
          step_free: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_hills?: boolean
          confidence_level?: number
          created_at?: string
          home_destination?: string | null
          id?: string
          late_night_default?: boolean
          low_data_mode?: boolean
          low_walking?: boolean
          onboarded?: boolean
          route_priority?: string
          step_free?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_hills?: boolean
          confidence_level?: number
          created_at?: string
          home_destination?: string | null
          id?: string
          late_night_default?: boolean
          low_data_mode?: boolean
          low_walking?: boolean
          onboarded?: boolean
          route_priority?: string
          step_free?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          level: number
          streak_days: number
          total_co2_saved: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number
          streak_days?: number
          total_co2_saved?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number
          streak_days?: number
          total_co2_saved?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone_or_email: string
          preferred_template: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone_or_email: string
          preferred_template?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone_or_email?: string
          preferred_template?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trip_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          share_token: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          share_token?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          share_token?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          co2_saved_kg: number | null
          created_at: string
          current_step_number: number
          distance_km: number | null
          ended_at: string | null
          from_label: string | null
          id: string
          last_check_in_at: string | null
          mode: string | null
          plan_json: Json | null
          started_at: string
          status: string
          to_label: string | null
          user_id: string
        }
        Insert: {
          co2_saved_kg?: number | null
          created_at?: string
          current_step_number?: number
          distance_km?: number | null
          ended_at?: string | null
          from_label?: string | null
          id?: string
          last_check_in_at?: string | null
          mode?: string | null
          plan_json?: Json | null
          started_at?: string
          status?: string
          to_label?: string | null
          user_id: string
        }
        Update: {
          co2_saved_kg?: number | null
          created_at?: string
          current_step_number?: number
          distance_km?: number | null
          ended_at?: string | null
          from_label?: string | null
          id?: string
          last_check_in_at?: string | null
          mode?: string | null
          plan_json?: Json | null
          started_at?: string
          status?: string
          to_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_trip: { Args: { p_token: string }; Returns: Json }
      log_journey_usage: {
        Args: { p_from: string; p_to: string }
        Returns: {
          created_at: string
          from_location: string
          id: string
          label: string | null
          last_used_at: string
          to_location: string
          usage_count: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "favourite_routes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
