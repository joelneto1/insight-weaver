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
      canais: {
        Row: {
          created_at: string
          email: string
          frequencia: string
          horario_postagem: string
          id: string
          idioma: string
          micronicho: string
          nicho: string
          nome: string
          subnicho: string
          updated_at: string
          user_id: string
          videos_postados: number
        }
        Insert: {
          created_at?: string
          email?: string
          frequencia?: string
          horario_postagem?: string
          id?: string
          idioma?: string
          micronicho?: string
          nicho?: string
          nome: string
          subnicho?: string
          updated_at?: string
          user_id: string
          videos_postados?: number
        }
        Update: {
          created_at?: string
          email?: string
          frequencia?: string
          horario_postagem?: string
          id?: string
          idioma?: string
          micronicho?: string
          nicho?: string
          nome?: string
          subnicho?: string
          updated_at?: string
          user_id?: string
          videos_postados?: number
        }
        Relationships: []
      }
      contas: {
        Row: {
          anotacoes: string | null
          created_at: string
          email: string
          id: string
          nick: string
          perfil_conectado: string | null
          plataforma: string | null
          senha_email: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string
          email: string
          id?: string
          nick: string
          perfil_conectado?: string | null
          plataforma?: string | null
          senha_email?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacoes?: string | null
          created_at?: string
          email?: string
          id?: string
          nick?: string
          perfil_conectado?: string | null
          plataforma?: string | null
          senha_email?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          canal_nome: string | null
          categoria: string
          cotacao_dolar: number | null
          created_at: string | null
          data: string
          descricao: string | null
          id: string
          recorrente: boolean | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor: number
          valor_usd: number | null
        }
        Insert: {
          canal_nome?: string | null
          categoria: string
          cotacao_dolar?: number | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          recorrente?: boolean | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor: number
          valor_usd?: number | null
        }
        Update: {
          canal_nome?: string | null
          categoria?: string
          cotacao_dolar?: number | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          recorrente?: boolean | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
          valor_usd?: number | null
        }
        Relationships: []
      }
      kanban_columns: {
        Row: {
          created_at: string | null
          id: string
          position: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          favorito: boolean
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string
          conteudo?: string
          created_at?: string
          favorito?: boolean
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          favorito?: boolean
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          member_email: string
          member_id: string | null
          owner_id: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_email: string
          member_id?: string | null
          owner_id: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_email?: string
          member_id?: string | null
          owner_id?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      videos: {
        Row: {
          canal_id: string | null
          column_id: string | null
          created_at: string
          data_postagem: string | null
          id: string
          position: number | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canal_id?: string | null
          column_id?: string | null
          created_at?: string
          data_postagem?: string | null
          id?: string
          position?: number | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canal_id?: string | null
          column_id?: string | null
          created_at?: string
          data_postagem?: string | null
          id?: string
          position?: number | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
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
