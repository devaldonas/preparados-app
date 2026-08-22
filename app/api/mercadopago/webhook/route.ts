import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🔥 Webhook chamado!')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', body)

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

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
      console.log('❌ Pedido não encontrado')
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    console.log('✅ Pedido #', order.id, 'atualizado!')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
