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

    // 🔥 BUSCAR PAGAMENTO NO MERCADO PAGO
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('❌ Token não configurado')
      return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const payment = await mpResponse.json()
    console.log('📥 Pagamento:', payment)

    // 🔥 EXTRAIR O EXTERNAL_REFERENCE
    const orderId = payment.external_reference?.replace('order_', '')
    console.log('📋 Order ID do external_reference:', orderId)

    let order = null

    // 🔥 1. TENTAR PELO TRANSACTION_ID
    const { data: orderByTransaction, error: error1 } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', String(paymentId))
      .maybeSingle()

    if (!error1 && orderByTransaction) {
      order = orderByTransaction
      console.log('✅ Pedido encontrado pelo transaction_id:', order.id)
    }

    // 🔥 2. TENTAR PELO ID (se não encontrou)
    if (!order && orderId) {
      const { data: orderById, error: error2 } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parseInt(orderId))
        .maybeSingle()

      if (!error2 && orderById) {
        order = orderById
        console.log('✅ Pedido encontrado pelo ID:', order.id)
      }
    }

    if (!order) {
      console.log('❌ Pedido não encontrado')
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 🔥 ATUALIZAR O PEDIDO
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: String(paymentId),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Update error' }, { status: 500 })
    }

    console.log('✅ Pedido #', order.id, 'atualizado para PAID!')
    return NextResponse.json({ success: true, orderId: order.id })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
