import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🚀 WEBHOOK VERSÃO FINAL - Buscando pedido 168!')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    console.log('💰 Payment ID:', paymentId)

    // 🔥 BUSCAR DIRETAMENTE O PEDIDO 168
    console.log('🔍 Buscando pedido 168...')
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 168)
      .maybeSingle()

    if (error) {
      console.error('❌ Erro no Supabase:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!order) {
      console.log('❌ Pedido 168 não encontrado!')
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('✅ Pedido 168 encontrado!', order)

    // 🔥 ATUALIZAR O PEDIDO
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: String(paymentId),
        updated_at: new Date().toISOString()
      })
      .eq('id', 168)

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Update error' }, { status: 500 })
    }

    console.log('✅ Pedido #168 atualizado para PAID!')
    return NextResponse.json({ success: true, orderId: 168 })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
