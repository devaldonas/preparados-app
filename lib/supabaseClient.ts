import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 🔥 SINGLETON - UMA ÚNICA INSTÂNCIA
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // 🔥 Chave única do app — evita conflito com outros apps no mesmo domínio
        // e ajuda a isolar a sessão
        storageKey: 'preparados-app-auth-token',
        // 🔥 PKCE — mais seguro, recomendado para SPAs
        flowType: 'pkce',
      },
      realtime: {
        params: {
          // 🔥 Limita eventos por segundo para não sobrecarregar em picos
          eventsPerSecond: 10,
        },
      },
    })
  }
  return supabaseInstance
}

// 🔥 EXPORTAR A INSTÂNCIA ÚNICA
export const supabase = getSupabaseClient()
