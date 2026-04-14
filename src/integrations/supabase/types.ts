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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      couple_invites: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          invite_code: string
          invited_by: string
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          invite_code: string
          invited_by: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          invited_by?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          partner_a: string
          partner_b: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_a: string
          partner_b?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_a?: string
          partner_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_couples_partner_a"
            columns: ["partner_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_couples_partner_b"
            columns: ["partner_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          couple_id: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          couple_id?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          couple_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      session_turns: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          role: string
          selected_emotion: string | null
          session_id: string
          speaker_id: string
          state_key: string
          transcript: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          role: string
          selected_emotion?: string | null
          session_id: string
          speaker_id: string
          state_key: string
          transcript?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          role?: string
          selected_emotion?: string | null
          session_id?: string
          speaker_id?: string
          state_key?: string
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_turns_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          couple_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          technique_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          technique_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          technique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_logs: {
        Row: {
          ai_analysis: Json
          created_at: string
          id: string
          raw_transcript: string
          session_id: string
          speaker: string
        }
        Insert: {
          ai_analysis?: Json
          created_at?: string
          id?: string
          raw_transcript: string
          session_id: string
          speaker: string
        }
        Update: {
          ai_analysis?: Json
          created_at?: string
          id?: string
          raw_transcript?: string
          session_id?: string
          speaker?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { _code: string }; Returns: string }
      find_invite_by_code: {
        Args: { _code: string }
        Returns: {
          couple_id: string
          id: string
          invited_by: string
        }[]
      }
      is_couple_member: {
        Args: { _couple_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      invite_status: "pending" | "accepted" | "expired"
      session_status: "in_progress" | "completed" | "abandoned"
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
      invite_status: ["pending", "accepted", "expired"],
      session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
