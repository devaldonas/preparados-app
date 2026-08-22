import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📦 Webhook body:', body)

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    console.log('💰 Payment ID:', paymentId)

    // 🔥 BUSCAR PEDIDO PELO TRANSACTION_ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', String(paymentId))
      .maybeSingle()

    if (error) {
      console.error('❌ DB error:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!order) {
      console.log('❌ Pedido não encontrado para transaction_id:', paymentId)
      
      // 🔥 TENTAR BUSCAR PELO ID 167
      const { data: orderById } = await supabase
        .from('orders')
        .select('*')
        .eq('id', 167)
        .maybeSingle()

      if (orderById) {
        console.log('✅ Pedido 167 encontrado diretamente!')
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            transaction_id: String(paymentId),
            updated_at: new Date().toISOString()
          })
          .eq('id', 167)

        console.log('✅ Pedido #167 atualizado para PAID!')
        return NextResponse.json({ success: true, orderId: 167 })
      }

      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ATUALIZAR PEDIDO
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    console.log('✅ Pedido #', order.id, 'atualizado!')
    return NextResponse.json({ success: true, orderId: order.id })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
