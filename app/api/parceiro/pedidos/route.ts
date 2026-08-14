import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  try {
    console.log('🔍 API de pedidos do parceiro chamada')
    
    // 🔥 Obter a sessão do usuário a partir do cookie
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ Usuário não autenticado')
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      }, { status: 401 })
    }

    console.log('✅ Usuário autenticado:', session.user.email)

    // 🔥 Buscar pedidos com o cliente normal (usa a sessão do usuário)
    const { data: pedidos, error } = await supabase
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
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ Pedidos encontrados:', pedidos?.length || 0)

    return NextResponse.json({ 
      success: true, 
      pedidos: pedidos || []
    })
  } catch (error) {
    console.error('❌ Erro na API:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
