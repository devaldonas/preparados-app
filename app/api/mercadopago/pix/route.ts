import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { total, orderId, userEmail, items } = await request.json()

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({
        success: false,
        error: 'Token do Mercado Pago não configurado'
      }, { status: 500 })
    }

    console.log('💰 Criando preferência para pedido:', orderId)
    console.log('💰 Total:', total)
    console.log('📧 E-mail:', userEmail)

    // 🔥 CRIAR PREFERÊNCIA DE PAGAMENTO - APENAS PIX
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [{
      id: `order-${orderId}`,
      title: `Pedido #${orderId} - PREPARADO`,
      quantity: 1,
      currency_id: 'BRL',
      unit_price: Number(total)
    }],
    payer: {
      email: userEmail
    },
    payment_methods: {
      installments: 1
    },
    auto_return: 'approved',
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    external_reference: `order_${orderId}`,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/loja/pedidos`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/loja/carrinho`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/loja/checkout?order=${orderId}`
    }
  })
})

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao criar preferência'
      }, { status: response.status })
    }

    console.log('✅ Preferência criada:', data.id)
    console.log('🔗 Link:', data.init_point)

    return NextResponse.json({
      success: true,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    })

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento'
    }, { status: 500 })
  }
}