import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from '@supabase/supabase-js'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // ==========================================
    // NAVEGADOR
    // ==========================================
    //
    // No navegador usamos createBrowserClient
    // do @supabase/ssr.
    //
    // A sessão será armazenada nos cookies,
    // permitindo que o proxy.ts consiga
    // identificar o usuário.
    //
    if (typeof window !== 'undefined') {
      supabaseInstance = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },
        }
      )
    }

    // ==========================================
    // SERVIDOR
    // ==========================================
    //
    // APIs e código executado no servidor
    // continuam usando o cliente tradicional.
    //
    else {
      supabaseInstance = createSupabaseClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      )
    }
  }

  return supabaseInstance
}

export const supabase = getSupabaseClient()
