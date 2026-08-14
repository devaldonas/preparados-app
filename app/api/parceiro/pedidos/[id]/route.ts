import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔥 Resolver a Promise do params
    const resolvedParams = await params
    const orderId = parseInt(resolvedParams.id)
    
    console.log('📥 Recebendo PATCH request para pedido:', orderId)
    
    // 🔥 Ler o corpo da requisição
    const body = await request.json()
    console.log('📥 Body:', body)
    
    const { status } = body

    console.log(`📤 Atualizando pedido #${orderId} para status: ${status}`)

    if (!orderId || !status) {
      console.log('❌ Dados incompletos:', { orderId, status })
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 Usar a chave de serviço para ignorar RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Erro ao atualizar:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Pedido atualizado:', data)

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
