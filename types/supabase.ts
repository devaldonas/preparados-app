// types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Tables {
  profiles: {
    Row: {
      id: string
      full_name: string | null
      role: string | null
      email: string | null
      cep: string | null
      city: string | null
      state: string | null
      latitude: number | null
      longitude: number | null
      mochila_tipo: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id: string
      full_name?: string | null
      role?: string | null
      email?: string | null
      cep?: string | null
      city?: string | null
      state?: string | null
      latitude?: number | null
      longitude?: number | null
      mochila_tipo?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      full_name?: string | null
      role?: string | null
      email?: string | null
      cep?: string | null
      city?: string | null
      state?: string | null
      latitude?: number | null
      longitude?: number | null
      mochila_tipo?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  products: {
    Row: {
      id: number
      name: string
      description: string | null
      price: number
      category: string | null
      stock: number
      image_url: string | null
      images: string[] | null
      mochila_tipo: string[] | null
      is_active: boolean
      is_digital: boolean
      free_shipping: boolean
      file_url: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: number
      name: string
      description?: string | null
      price: number
      category?: string | null
      stock?: number
      image_url?: string | null
      images?: string[] | null
      mochila_tipo?: string[] | null
      is_active?: boolean
      is_digital?: boolean
      free_shipping?: boolean
      file_url?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: number
      name?: string
      description?: string | null
      price?: number
      category?: string | null
      stock?: number
      image_url?: string | null
      images?: string[] | null
      mochila_tipo?: string[] | null
      is_active?: boolean
      is_digital?: boolean
      free_shipping?: boolean
      file_url?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  orders: {
    Row: {
      id: number
      user_id: string
      total_amount: number
      payment_status: string
      status: string
      shipping_address: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: number
      user_id: string
      total_amount: number
      payment_status?: string
      status?: string
      shipping_address?: Json | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: number
      user_id?: string
      total_amount?: number
      payment_status?: string
      status?: string
      shipping_address?: Json | null
      created_at?: string
      updated_at?: string
    }
  }
  mentoria_lives: {
    Row: {
      id: number
      youtube_id: string
      titulo: string
      descricao: string | null
      data_hora: string | null
      duracao: number | null
      is_active: boolean
      is_live: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: number
      youtube_id: string
      titulo: string
      descricao?: string | null
      data_hora?: string | null
      duracao?: number | null
      is_active?: boolean
      is_live?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: number
      youtube_id?: string
      titulo?: string
      descricao?: string | null
      data_hora?: string | null
      duracao?: number | null
      is_active?: boolean
      is_live?: boolean
      created_at?: string
      updated_at?: string
    }
  }
  mentoria_notificacoes: {
    Row: {
      id: number
      usuario_id: string
      live_id: number
      enviado: boolean
      enviado_em: string | null
      created_at: string
    }
    Insert: {
      id?: number
      usuario_id: string
      live_id: number
      enviado?: boolean
      enviado_em?: string | null
      created_at?: string
    }
    Update: {
      id?: number
      usuario_id?: string
      live_id?: number
      enviado?: boolean
      enviado_em?: string | null
      created_at?: string
    }
  }
}

export type TablesInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TablesUpdate<T extends keyof Tables> = Tables[T]['Update']
export type TablesRow<T extends keyof Tables> = Tables[T]['Row']
