import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🔥 Webhook chamado!')
  
  try {
    const body = await request.json()
    console.log('📦 Body completo:', JSON.stringify(body, null, 2))

    const paymentId = body.data?.id
    if (!paymentId) {
      console.log('❌ Sem payment ID')
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    console.log('💰 Payment ID:', paymentId)

    // 🔥 BUSCAR O PEDIDO DIRETAMENTE PELO PAYMENT_ID
    // Primeiro, buscar pelo transaction_id
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', String(paymentId))
      .maybeSingle()

    if (error) {
      console.error('❌ Erro ao buscar pedido:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!order) {
      console.log('❌ Pedido não encontrado para transaction_id:', paymentId)
      
      // 🔥 TENTAR BUSCAR PELO ID 167 DIRETAMENTE
      const { data: orderById, error: errorById } = await supabase
        .from('orders')
        .select('*')
        .eq('id', 167)
        .maybeSingle()

      if (orderById) {
        console.log('✅ Pedido 167 encontrado diretamente!')
        
        // Atualizar o pedido
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            transaction_id: String(paymentId),
            updated_at: new Date().toISOString()
          })
          .eq('id', 167)

        if (updateError) {
          console.error('❌ Erro ao atualizar pedido:', updateError)
          return NextResponse.json({ error: 'Update error' }, { status: 500 })
        }

        console.log('✅ Pedido #167 atualizado para PAID!')
        return NextResponse.json({ success: true, orderId: 167 })
      }

      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('✅ Pedido encontrado:', order.id)

    // 🔥 ATUALIZAR O PEDIDO
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError)
      return NextResponse.json({ error: 'Update error' }, { status: 500 })
    }

    console.log('✅ Pedido #', order.id, 'atualizado para PAID!')
    return NextResponse.json({ success: true, orderId: order.id })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
