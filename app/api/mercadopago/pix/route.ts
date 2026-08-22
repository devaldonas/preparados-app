import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { total, orderId, userEmail, items } = await request.json()

    console.log('💰 Criando PIX para pedido:', orderId)
    console.log('💰 Total:', total)

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({
        success: false,
        error: 'Token do Mercado Pago não configurado'
      }, { status: 500 })
    }

    const unitPrice = Number(total)
    if (isNaN(unitPrice) || unitPrice <= 0) {
      console.error('❌ Valor inválido:', total)
      return NextResponse.json({
        success: false,
        error: 'Valor inválido para pagamento'
      }, { status: 400 })
    }

    const idempotencyKey = `pix_${orderId}_${Date.now()}`

    const paymentData = {
      transaction_amount: unitPrice,
      description: `Pedido #${orderId} - PREPARADO`,
      payment_method_id: 'pix',
      external_reference: `order_${orderId}`,
      payer: {
        email: userEmail || 'cliente@email.com'
      },
      metadata: {
        order_id: orderId,
        platform: 'preparados'
      },
      // 🔥 URL COMPLETA DO WEBHOOK
      notification_url: `https://preparado.vercel.app/api/mercadopago/webhook`
    }

    console.log('📤 Enviando para API de pagamentos...')
    console.log('🔗 Webhook URL:', paymentData.notification_url)

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao criar pagamento'
      }, { status: response.status })
    }

    console.log('✅ Pagamento criado:', data.id)

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code_base64 || null
    const copiaCola = data.point_of_interaction?.transaction_data?.qr_code || null

    return NextResponse.json({
      success: true,
      qrCode: qrCode,
      codigoPix: copiaCola,
      paymentId: data.id,
      status: data.status
    })

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento'
    }, { status: 500 })
  }
}
