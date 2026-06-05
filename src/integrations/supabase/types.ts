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
      achievements: {
        Row: {
          achievement_date: string
          child_id: string
          created_at: string
          grade: string | null
          id: string
          notes: string | null
          photo_url: string | null
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_date?: string
          child_id: string
          created_at?: string
          grade?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          subject: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_date?: string
          child_id?: string
          created_at?: string
          grade?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      book_orders: {
        Row: {
          cost_breakdown: Json
          created_at: string
          delivered_at: string | null
          id: string
          printful_order_id: string | null
          shipped_at: string | null
          shipping_address: Json
          status: string
          tracking_url: string | null
          user_book_id: string
        }
        Insert: {
          cost_breakdown?: Json
          created_at?: string
          delivered_at?: string | null
          id?: string
          printful_order_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          status?: string
          tracking_url?: string | null
          user_book_id: string
        }
        Update: {
          cost_breakdown?: Json
          created_at?: string
          delivered_at?: string | null
          id?: string
          printful_order_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          status?: string
          tracking_url?: string | null
          user_book_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_orders_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_templates: {
        Row: {
          category: string
          color_scheme: Json
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_premium: boolean
          name: string
          page_layouts: Json
          pages_needed: number
          slug: string
          sort_order: number
          suggested_age_range: string | null
        }
        Insert: {
          category: string
          color_scheme?: Json
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_premium?: boolean
          name: string
          page_layouts?: Json
          pages_needed?: number
          slug: string
          sort_order?: number
          suggested_age_range?: string | null
        }
        Update: {
          category?: string
          color_scheme?: Json
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_premium?: boolean
          name?: string
          page_layouts?: Json
          pages_needed?: number
          slug?: string
          sort_order?: number
          suggested_age_range?: string | null
        }
        Relationships: []
      }
      child_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          child_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          owner_id: string
          revoked_at: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          child_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          owner_id: string
          revoked_at?: string | null
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          child_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          owner_id?: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_invites_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dob: string
          id: string
          name: string
          pronouns: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dob: string
          id?: string
          name: string
          pronouns?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dob?: string
          id?: string
          name?: string
          pronouns?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      child_shares: {
        Row: {
          accepted_at: string | null
          child_id: string
          created_at: string
          id: string
          invite_email: string | null
          owner_id: string
          role: string
          shared_with_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          child_id: string
          created_at?: string
          id?: string
          invite_email?: string | null
          owner_id: string
          role?: string
          shared_with_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          child_id?: string
          created_at?: string
          id?: string
          invite_email?: string | null
          owner_id?: string
          role?: string
          shared_with_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_shares_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          child_id: string
          created_at: string
          file_path: string
          id: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          child_id: string
          created_at?: string
          file_path: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          child_id?: string
          created_at?: string
          file_path?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guidance_progress: {
        Row: {
          child_id: string
          completed_at: string
          guide_key: string
          id: string
          user_id: string
        }
        Insert: {
          child_id: string
          completed_at?: string
          guide_key: string
          id?: string
          user_id: string
        }
        Update: {
          child_id?: string
          completed_at?: string
          guide_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_cycle: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          plan_id: string | null
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          category: string
          child_id: string
          created_at: string
          happened_at: string
          id: string
          photo_url: string | null
          photo_urls: string[]
          reaction: string | null
          story: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          who_was_there: string[]
        }
        Insert: {
          category?: string
          child_id: string
          created_at?: string
          happened_at?: string
          id?: string
          photo_url?: string | null
          photo_urls?: string[]
          reaction?: string | null
          story?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          who_was_there?: string[]
        }
        Update: {
          category?: string
          child_id?: string
          created_at?: string
          happened_at?: string
          id?: string
          photo_url?: string | null
          photo_urls?: string[]
          reaction?: string | null
          story?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          who_was_there?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "memories_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          child_id: string
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          child_id: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          child_id?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          id: string
          key: string
          plan_id: string
          updated_at: string
          value_bool: boolean | null
          value_int: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          plan_id: string
          updated_at?: string
          value_bool?: boolean | null
          value_int?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          plan_id?: string
          updated_at?: string
          value_bool?: boolean | null
          value_int?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_books: {
        Row: {
          binding_type: string
          book_size: string
          child_id: string
          color_override: Json
          created_at: string
          custom_pages: Json
          id: string
          layout_order: Json
          memories_selected: Json
          order_date: string | null
          paper_quality: string
          parent_id: string
          preview_url: string | null
          price_total: number
          quantity: number
          status: string
          subtitle: string | null
          template_id: string
          title: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          binding_type?: string
          book_size?: string
          child_id: string
          color_override?: Json
          created_at?: string
          custom_pages?: Json
          id?: string
          layout_order?: Json
          memories_selected?: Json
          order_date?: string | null
          paper_quality?: string
          parent_id: string
          preview_url?: string | null
          price_total?: number
          quantity?: number
          status?: string
          subtitle?: string | null
          template_id: string
          title?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          binding_type?: string
          book_size?: string
          child_id?: string
          color_override?: Json
          created_at?: string
          custom_pages?: Json
          id?: string
          layout_order?: Json
          memories_selected?: Json
          order_date?: string | null
          paper_quality?: string
          parent_id?: string
          preview_url?: string | null
          price_total?: number
          quantity?: number
          status?: string
          subtitle?: string | null
          template_id?: string
          title?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "book_templates"
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
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { _token: string }; Returns: string }
      claim_super_admin: { Args: never; Returns: boolean }
      has_child_access: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      has_child_edit_access: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_invite: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          child_id: string
          child_name: string
          email: string
          expires_at: string
          id: string
          owner_id: string
          revoked_at: string
          role: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
