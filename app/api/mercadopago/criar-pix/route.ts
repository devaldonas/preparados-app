import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { orderId, amount, description } = await request.json()
    console.log('📤 Criando PIX para pedido:', orderId)

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não configurado')
      return NextResponse.json(
        { error: 'Token do Mercado Pago não configurado' },
        { status: 500 }
      )
    }

    // Buscar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Pedido não encontrado:', orderId)
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Pedido encontrado:', order.id)

    // 🔥 USAR FETCH DIRETO PARA O MERCADO PAGO
    const paymentData = {
      transaction_amount: amount,
      description: description || `Pedido #${orderId}`,
      payment_method_id: 'pix',
      external_reference: String(orderId),
      payer: {
        email: order.email || 'cliente@email.com',
        first_name: order.customer_name || 'Cliente',
      },
      metadata: {
        order_id: orderId,
        platform: 'preparados'
      }
    }

    console.log('📤 Enviando para Mercado Pago...')

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    })

    const result = await response.json()
    console.log('📥 Resposta do Mercado Pago:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error('❌ Erro no Mercado Pago:', result)
      return NextResponse.json(
        { error: result.message || 'Erro ao criar pagamento' },
        { status: response.status }
      )
    }

    console.log('✅ Pagamento criado:', result.id, 'Status:', result.status)

    // Atualizar pedido com transaction_id
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        transaction_id: result.id,
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError)
    }

    // Extrair QR Code
    const qrCode = result.point_of_interaction?.transaction_data?.qr_code_base64 || null
    const copiaCola = result.point_of_interaction?.transaction_data?.qr_code || null

    console.log('✅ QR Code gerado:', qrCode ? 'Sim' : 'Não')
    console.log('✅ Código PIX gerado:', copiaCola ? 'Sim' : 'Não')

    return NextResponse.json({
      success: true,
      qrCode: qrCode,
      codigoPix: copiaCola,
      paymentId: result.id,
      status: result.status
    })

  } catch (error: any) {
    console.error('❌ Erro ao gerar PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar PIX' },
      { status: 500 }
    )
  }
}

// 🔥 Redeploy forçado em sáb 22 ago 2026 15:15:50 -03
// 🔥 Redeploy sáb 22 ago 2026 15:26:50 -03
