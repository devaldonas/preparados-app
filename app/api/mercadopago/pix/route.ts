import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { total, orderId, userEmail } = await request.json()

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      throw new Error('Token do Mercado Pago não configurado')
    }

    // 🔥 CRIAR PREFERÊNCIA DE PAGAMENTO
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: `order-${orderId}`,
          title: `Pedido #${orderId}`,
          description: `Pagamento do pedido ${orderId}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(total)
        }],
        payer: {
          email: userEmail
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [
            { id: 'ticket' },
            { id: 'bank_transfer' },
            { id: 'atm' }
          ],
          installments: 1
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/loja/pedidos`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/loja/carrinho`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/loja/checkout`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
        external_reference: `order_${orderId}`,
        metadata: {
          order_id: orderId
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      throw new Error(data.message || 'Erro ao criar preferência')
    }

    console.log('✅ Preferência criada:', data.id)

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