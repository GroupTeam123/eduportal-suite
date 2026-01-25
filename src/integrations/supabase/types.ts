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
      departments: {
        Row: {
          created_at: string
          description: string | null
          hod_user_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hod_user_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hod_user_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
          uploader_user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          uploader_user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_students: {
        Row: {
          attendance: number | null
          contact: number | null
          created_at: string
          custom_fields: Json | null
          department_id: string
          email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          marks: Json | null
          name: string
          notes: string | null
          student_id: string | null
          teacher_user_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          attendance?: number | null
          contact?: number | null
          created_at?: string
          custom_fields?: Json | null
          department_id: string
          email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marks?: Json | null
          name: string
          notes?: string | null
          student_id?: string | null
          teacher_user_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          attendance?: number | null
          contact?: number | null
          created_at?: string
          custom_fields?: Json | null
          department_id?: string
          email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marks?: Json | null
          name?: string
          notes?: string | null
          student_id?: string | null
          teacher_user_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imported_students_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          qualifications: string | null
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          qualifications?: string | null
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          qualifications?: string | null
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          chart_data: Json | null
          content: string | null
          created_at: string
          department_id: string | null
          id: string
          reporter_role: Database["public"]["Enums"]["app_role"]
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"]
          submitted_to_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          chart_data?: Json | null
          content?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          reporter_role: Database["public"]["Enums"]["app_role"]
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
          submitted_to_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          chart_data?: Json | null
          content?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          reporter_role?: Database["public"]["Enums"]["app_role"]
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          submitted_to_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      student_records: {
        Row: {
          attendance: number | null
          contact: number | null
          created_at: string
          custom_fields: Json | null
          department_id: string
          email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          marks: Json | null
          name: string
          notes: string | null
          student_id: string | null
          teacher_user_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          attendance?: number | null
          contact?: number | null
          created_at?: string
          custom_fields?: Json | null
          department_id: string
          email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marks?: Json | null
          name: string
          notes?: string | null
          student_id?: string | null
          teacher_user_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          attendance?: number | null
          contact?: number | null
          created_at?: string
          custom_fields?: Json | null
          department_id?: string
          email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marks?: Json | null
          name?: string
          notes?: string | null
          student_id?: string | null
          teacher_user_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          teacher_user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          teacher_user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          teacher_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_department: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_document_storage: {
        Args: { file_path: string }
        Returns: boolean
      }
      get_hod_department: { Args: { _user_id: string }; Returns: string }
      get_user_department: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hod: { Args: { _user_id: string }; Returns: boolean }
      is_principal: { Args: { _user_id: string }; Returns: boolean }
      is_teacher: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "teacher" | "hod" | "principal"
      report_status:
        | "draft"
        | "submitted_to_hod"
        | "submitted_to_principal"
        | "approved"
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
      app_role: ["teacher", "hod", "principal"],
      report_status: [
        "draft",
        "submitted_to_hod",
        "submitted_to_principal",
        "approved",
      ],
    },
  },
} as const
