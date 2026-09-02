import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🚀 WEBHOOK - Recebido!')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    // 🔥 IDENTIFICAR O TIPO DE EVENTO
    const { type, data, topic, id } = body

    console.log('📌 Tipo:', type || topic)
    console.log('📌 ID:', id || data?.id)

    // 🔥 PROCESSAR ASSINATURA (preapproval)
    if (type === 'preapproval' || topic === 'preapproval') {
      console.log('🔄 Processando assinatura...')
      return await processarAssinatura(data?.id || id, body)
    }

    // 🔥 PROCESSAR PAGAMENTO (payment)
    if (type === 'payment' || topic === 'payment') {
      console.log('💳 Processando pagamento...')
      return await processarPagamento(data?.id || id, body)
    }

    // 🔥 PROCESSAR ORDEM (merchant_order)
    if (topic === 'merchant_order') {
      console.log('📦 Processando merchant_order...')
      return await processarMerchantOrder(id, body)
    }

    // 🔥 SE NÃO IDENTIFICOU, TENTAR PROCESSAR COMO PAGAMENTO DIRETO
    if (data?.id) {
      console.log('🔄 Tentando processar como pagamento direto...')
      return await processarPagamento(data.id, body)
    }

    console.log('⚠️ Tipo de evento não reconhecido:', type || topic)
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

// 🔥 PROCESSAR ASSINATURA
async function processarAssinatura(paymentId: string, body: any) {
  try {
    console.log('💰 Payment ID:', paymentId)

    // 🔥 BUSCAR O PAGAMENTO NO MERCADO PAGO
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    
    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
    }

    const response = await fetch(`https://api.mercadopago.com/preapproval/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const preapproval = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao buscar assinatura:', preapproval)
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: response.status })
    }

    console.log('✅ Assinatura encontrada:', {
      id: preapproval.id,
      status: preapproval.status,
      external_reference: preapproval.external_reference
    })

    // 🔥 EXTRAIR O USER_ID DO external_reference
    const externalReference = preapproval.external_reference || ''
    const userId = externalReference.replace('plan_2_user_', '')

    if (!userId) {
      console.warn('⚠️ Usuário não identificado')
      return NextResponse.json({ error: 'Usuário não identificado' }, { status: 400 })
    }

    // 🔥 ATUALIZAR O PERFIL
    if (preapproval.status === 'authorized' || preapproval.status === 'approved') {
      console.log(`✅ Assinatura autorizada para usuário: ${userId}`)

      const { data, error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          plan_id: 2,
          subscription_id: preapproval.id,
          payment_method: 'card'
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error)
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
      }

      console.log('✅ Assinatura ativada para o usuário:', userId)
      return NextResponse.json({ success: true, message: 'Assinatura ativada', userId })
    } else {
      console.log(`⏳ Assinatura ${preapproval.status} para usuário: ${userId}`)
    }

    return NextResponse.json({ success: true, status: preapproval.status })

  } catch (error) {
    console.error('❌ Erro ao processar assinatura:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 🔥 PROCESSAR PAGAMENTO
async function processarPagamento(paymentId: string, body: any) {
  try {
    console.log('💰 Payment ID:', paymentId)

    // 🔥 BUSCAR O PAGAMENTO NO MERCADO PAGO
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

    // 🔥 VERIFICAR SE É UM PAGAMENTO DE ASSINATURA
    const externalReference = payment.external_reference || ''
    
    if (externalReference.includes('plan_')) {
      console.log('🔄 Pagamento de assinatura detectado')
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

    // 🔥 SE FOR PEDIDO DA LOJA
    const orderId = externalReference.replace('order_', '')
    if (orderId && !isNaN(Number(orderId))) {
      console.log(`🔄 Pedido da loja #${orderId}`)
      
      if (payment.status === 'approved') {
        await atualizarPedido(Number(orderId), paymentId)
      }
    }

    return NextResponse.json({ success: true, status: payment.status })

  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 🔥 PROCESSAR MERCHANT_ORDER
async function processarMerchantOrder(orderId: string, body: any) {
  try {
    console.log('📦 Merchant Order ID:', orderId)

    // 🔥 BUSCAR A ORDEM NO MERCADO PAGO
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    
    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
    }

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
      external_reference: order.external_reference
    })

    // 🔥 EXTRAIR O external_reference
    const externalReference = order.external_reference || ''

    // 🔥 VERIFICAR SE É UM PEDIDO DA LOJA
    if (externalReference.includes('order_')) {
      const orderId = externalReference.replace('order_', '')
      const isPaid = order.payments?.some((p: any) => p.status === 'approved')

      if (isPaid && !isNaN(Number(orderId))) {
        const paymentId = order.payments?.find((p: any) => p.status === 'approved')?.id
        await atualizarPedido(Number(orderId), paymentId)
        console.log(`✅ Pedido #${orderId} atualizado para PAID!`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro ao processar merchant_order:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 🔥 FUNÇÃO AUXILIAR PARA ATUALIZAR PEDIDO
async function atualizarPedido(orderId: number, paymentId: string) {
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      transaction_id: String(paymentId),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('❌ Erro ao atualizar pedido:', updateError)
    throw updateError
  }

  console.log('✅ Pedido #', orderId, 'atualizado para PAID!')
}
