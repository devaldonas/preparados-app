import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🔥 Webhook chamado!')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    const paymentId = body.data?.id
    if (!paymentId) {
      console.log('❌ Sem payment ID')
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    console.log('💰 Payment ID:', paymentId)

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

    if (!mpResponse.ok) {
      console.error('❌ Erro ao buscar pagamento:', mpResponse.status)
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: mpResponse.status })
    }

    const payment = await mpResponse.json()
    console.log('📥 Pagamento recebido:', JSON.stringify(payment, null, 2))

    // 🔥 EXTRAIR O EXTERNAL_REFERENCE
    const orderId = payment.external_reference
    console.log('📋 Order ID do external_reference:', orderId)

    // 🔥 PROCURAR O PEDIDO
    let order = null

    // 1. TENTAR PELO TRANSACTION_ID
    const { data: orderByTransaction } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', String(paymentId))
      .maybeSingle()

    if (orderByTransaction) {
      order = orderByTransaction
      console.log('✅ Pedido encontrado pelo transaction_id:', order.id)
    }

    // 2. TENTAR PELO ID
    if (!order && orderId) {
      const orderIdNum = parseInt(orderId.replace('order_', ''))
      if (!isNaN(orderIdNum)) {
        const { data: orderById } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderIdNum)
          .maybeSingle()

        if (orderById) {
          order = orderById
          console.log('✅ Pedido encontrado pelo ID:', order.id)
        }
      }
    }

    // 3. TENTAR PELO PAYMENT ID (BUSCA DIRETA)
    if (!order) {
      console.log('🔍 Buscando pedido com transaction_id:', paymentId)
      const { data: orderByPayment } = await supabase
        .from('orders')
        .select('*')
        .eq('transaction_id', paymentId)
        .maybeSingle()

      if (orderByPayment) {
        order = orderByPayment
        console.log('✅ Pedido encontrado pelo payment_id:', order.id)
      }
    }

    if (!order) {
      console.log('❌ Pedido não encontrado para payment_id:', paymentId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('✅ Pedido encontrado:', order.id)

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
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
