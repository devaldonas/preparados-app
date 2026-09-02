import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🚀 WEBHOOK - Recebido!')
  
  try {
    // 🔥 LER O BODY COMO TEXTO PRIMEIRO
    const rawBody = await request.text()
    console.log('📦 Raw Body:', rawBody)

    // 🔥 TENTAR PARSEAR COMO JSON
    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('📦 Body parseado:', JSON.stringify(body, null, 2))

    // 🔥 EXTRAIR DADOS
    const { type, data, topic, id } = body

    console.log('📌 Type:', type)
    console.log('📌 Topic:', topic)
    console.log('📌 ID:', id)
    console.log('📌 Data:', data)

    // 🔥 SE FOR merchant_order
    if (topic === 'merchant_order' || id) {
      const orderId = id || data?.id
      console.log(`📦 Processando merchant_order ID: ${orderId}`)

      // 🔥 BUSCAR A ORDEM NO MERCADO PAGO
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
      
      if (!accessToken) {
        console.error('❌ Token do Mercado Pago não configurado')
        return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
      }

      console.log('🔍 Buscando ordem no Mercado Pago...')

      const response = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const order = await response.json()

      if (!response.ok) {
        console.error('❌ Erro ao buscar ordem:', order)
        return NextResponse.json({ error: 'Erro ao buscar ordem' }, { status: response.status })
      }

      console.log('✅ Ordem encontrada:', {
        id: order.id,
        status: order.order_status,
        external_reference: order.external_reference,
        payments: order.payments?.length || 0
      })

      // 🔥 EXTRAIR O external_reference
      const externalReference = order.external_reference || ''

      // 🔥 VERIFICAR SE É UM PEDIDO DA LOJA
      if (externalReference.includes('order_')) {
        const orderIdNumber = externalReference.replace('order_', '')
        const isPaid = order.payments?.some((p: any) => p.status === 'approved')

        if (isPaid && !isNaN(Number(orderIdNumber))) {
          const paymentId = order.payments?.find((p: any) => p.status === 'approved')?.id
          console.log(`✅ Pagamento aprovado para pedido #${orderIdNumber}, payment_id: ${paymentId}`)
          
          // 🔥 ATUALIZAR O PEDIDO
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              transaction_id: String(paymentId || orderId),
              updated_at: new Date().toISOString()
            })
            .eq('id', Number(orderIdNumber))

          if (updateError) {
            console.error('❌ Erro ao atualizar pedido:', updateError)
            return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
          }

          console.log(`✅ Pedido #${orderIdNumber} atualizado para PAID!`)
          return NextResponse.json({ success: true, orderId: orderIdNumber })
        } else {
          console.log(`⏳ Pedido #${orderIdNumber} ainda não aprovado`)
          return NextResponse.json({ success: true, status: 'pending' })
        }
      }

      // 🔥 VERIFICAR SE É UMA ASSINATURA
      if (externalReference.includes('plan_')) {
        console.log('🔄 Assinatura detectada')
        const userId = externalReference.replace('plan_2_user_', '')
        const isPaid = order.payments?.some((p: any) => p.status === 'approved')

        if (isPaid && userId) {
          console.log(`✅ Assinatura aprovada para usuário: ${userId}`)
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              plan_id: 2
            })
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Erro ao atualizar perfil:', updateError)
            return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
          }

          console.log(`✅ Assinatura ativada para: ${userId}`)
          return NextResponse.json({ success: true, userId })
        }
      }

      return NextResponse.json({ success: true, message: 'Processado' })
    }

    // 🔥 SE FOR payment
    if (topic === 'payment' || type === 'payment') {
      console.log('💳 Processando pagamento...')
      const paymentId = id || data?.id
      
      // 🔥 BUSCAR O PAGAMENTO
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
      
      if (!accessToken) {
        console.error('❌ Token do Mercado Pago não configurado')
        return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payment = await response.json()

      if (!response.ok) {
        console.error('❌ Erro ao buscar pagamento:', payment)
        return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: response.status })
      }

      console.log('✅ Pagamento encontrado:', {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference
      })

      // 🔥 PROCESSAR ASSINATURA
      const externalReference = payment.external_reference || ''
      
      if (externalReference.includes('plan_')) {
        const userId = externalReference.replace('plan_2_user_', '')
        
        if (userId && payment.status === 'approved') {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              plan_id: 2
            })
            .eq('id', userId)
          
          console.log('✅ Assinatura ativada para:', userId)
        }
      }

      // 🔥 PROCESSAR PEDIDO DA LOJA
      if (externalReference.includes('order_')) {
        const orderId = externalReference.replace('order_', '')
        
        if (!isNaN(Number(orderId)) && payment.status === 'approved') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              transaction_id: String(payment.id),
              updated_at: new Date().toISOString()
            })
            .eq('id', Number(orderId))
          
          console.log(`✅ Pedido #${orderId} atualizado para PAID!`)
        }
      }

      return NextResponse.json({ success: true })
    }

    // 🔥 SE NÃO RECONHECEU
    console.log('⚠️ Evento não reconhecido')
    return NextResponse.json({ 
      success: false, 
      message: 'Evento não reconhecido',
      received: { type, topic, id }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
