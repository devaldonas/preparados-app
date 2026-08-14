import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 🔥 Criar cliente admin com a chave de serviço
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔑 Service Key presente?', serviceKey ? 'Sim' : 'Não')
    console.log('🔑 URL:', supabaseUrl)
    
    // 🔥 Se a chave de serviço não estiver disponível, tente usar a chave anônima
    let supabaseClient
    
    if (serviceKey) {
      supabaseClient = createClient(supabaseUrl!, serviceKey!)
    } else {
      // Fallback para chave anônima (pode não funcionar com RLS)
      const { supabase } = await import('@/lib/supabaseClient')
      supabaseClient = supabase
    }

    // Buscar pedidos
    const { data: pedidos, error } = await supabaseClient
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hint: 'Verifique as políticas RLS'
      }, { status: 500 })
    }

    console.log('✅ Pedidos encontrados:', pedidos?.length || 0)

    return NextResponse.json({ 
      success: true, 
      pedidos: pedidos || []
    })
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
