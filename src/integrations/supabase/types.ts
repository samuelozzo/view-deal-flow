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
      applications: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          message: string | null
          offer_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
          offer_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
          offer_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          application_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount_cents: number
          creator_id: string | null
          duration_days: number
          funded_at: string
          id: string
          offer_id: string
          refunded_at: string | null
          released_at: string | null
          scheduled_release_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          submission_id: string | null
        }
        Insert: {
          amount_cents: number
          creator_id?: string | null
          duration_days?: number
          funded_at?: string
          id?: string
          offer_id: string
          refunded_at?: string | null
          released_at?: string | null
          scheduled_release_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          submission_id?: string | null
        }
        Update: {
          amount_cents?: number
          creator_id?: string | null
          duration_days?: number
          funded_at?: string
          id?: string
          offer_id?: string
          refunded_at?: string | null
          released_at?: string | null
          scheduled_release_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          business_id: string
          category: string
          claimed_reward_cents: number
          created_at: string
          description: string
          escrow_funded: boolean
          id: string
          platform: Database["public"]["Enums"]["platform_type"]
          required_views: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          total_reward_cents: number
          updated_at: string
          views_per_product: number | null
        }
        Insert: {
          business_id: string
          category: string
          claimed_reward_cents?: number
          created_at?: string
          description: string
          escrow_funded?: boolean
          id?: string
          platform: Database["public"]["Enums"]["platform_type"]
          required_views: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          status?: Database["public"]["Enums"]["offer_status"]
          title: string
          total_reward_cents: number
          updated_at?: string
          views_per_product?: number | null
        }
        Update: {
          business_id?: string
          category?: string
          claimed_reward_cents?: number
          created_at?: string
          description?: string
          escrow_funded?: boolean
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          required_views?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          total_reward_cents?: number
          updated_at?: string
          views_per_product?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount_cents: number
          iban: string
          id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          wallet_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_cents: number
          iban: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          wallet_id: string
        }
        Update: {
          admin_note?: string | null
          amount_cents?: number
          iban?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          platform_links: Json | null
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          platform_links?: Json | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          platform_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          actual_views: number
          admin_note: string | null
          application_id: string
          calculated_earnings_cents: number
          content_url: string
          id: string
          rejected_at: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          verified_at: string | null
        }
        Insert: {
          actual_views: number
          admin_note?: string | null
          application_id: string
          calculated_earnings_cents?: number
          content_url: string
          id?: string
          rejected_at?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          verified_at?: string | null
        }
        Update: {
          actual_views?: number
          admin_note?: string | null
          application_id?: string
          calculated_earnings_cents?: number
          content_url?: string
          id?: string
          rejected_at?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      topup_intents: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          method: Database["public"]["Enums"]["topup_method"]
          reference: string | null
          status: Database["public"]["Enums"]["topup_status"]
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          method: Database["public"]["Enums"]["topup_method"]
          reference?: string | null
          status?: Database["public"]["Enums"]["topup_status"]
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          method?: Database["public"]["Enums"]["topup_method"]
          reference?: string | null
          status?: Database["public"]["Enums"]["topup_status"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topup_intents_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          direction: Database["public"]["Enums"]["wallet_transaction_direction"]
          id: string
          metadata: Json | null
          payment_intent_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["wallet_transaction_status"]
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          direction: Database["public"]["Enums"]["wallet_transaction_direction"]
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          direction?: Database["public"]["Enums"]["wallet_transaction_direction"]
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_cents: number
          created_at: string
          id: string
          reserved_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_cents?: number
          created_at?: string
          id?: string
          reserved_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_cents?: number
          created_at?: string
          id?: string
          reserved_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_my_payout_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_note: string
          amount_cents: number
          iban_masked: string
          id: string
          processed_at: string
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          wallet_id: string
        }[]
      }
      get_my_payout_requests_masked: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_note: string
          amount_cents: number
          iban_masked: string
          id: string
          processed_at: string
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          wallet_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_wallet: {
        Args: { _user_id: string; _wallet_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "creator" | "business"
      app_role: "admin" | "creator" | "business"
      application_status: "pending" | "accepted" | "rejected"
      escrow_status: "funded" | "released" | "refunded"
      offer_status: "draft" | "open" | "completed" | "cancelled"
      payout_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      platform_type: "TikTok" | "Instagram" | "YouTube"
      reward_type: "cash" | "product" | "discount"
      submission_status: "pending_verification" | "verified" | "rejected"
      topup_method: "card" | "bank_transfer"
      topup_status: "pending" | "completed" | "failed" | "cancelled"
      wallet_transaction_direction: "in" | "out"
      wallet_transaction_status: "pending" | "completed" | "failed"
      wallet_transaction_type:
        | "escrow_reserve"
        | "escrow_release"
        | "payout"
        | "topup"
        | "refund"
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
      account_type: ["creator", "business"],
      app_role: ["admin", "creator", "business"],
      application_status: ["pending", "accepted", "rejected"],
      escrow_status: ["funded", "released", "refunded"],
      offer_status: ["draft", "open", "completed", "cancelled"],
      payout_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      platform_type: ["TikTok", "Instagram", "YouTube"],
      reward_type: ["cash", "product", "discount"],
      submission_status: ["pending_verification", "verified", "rejected"],
      topup_method: ["card", "bank_transfer"],
      topup_status: ["pending", "completed", "failed", "cancelled"],
      wallet_transaction_direction: ["in", "out"],
      wallet_transaction_status: ["pending", "completed", "failed"],
      wallet_transaction_type: [
        "escrow_reserve",
        "escrow_release",
        "payout",
        "topup",
        "refund",
      ],
    },
  },
} as const
