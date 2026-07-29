import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📦 Body recebido na API:', body)

    const { pedidoId, valor, descricao, cliente } = body

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({
        success: false,
        error: 'Token do Mercado Pago não configurado'
      }, { status: 500 })
    }

    console.log('💰 Criando preferência para cartão:', pedidoId)
    console.log('💰 Valor:', valor)
    console.log('📧 E-mail:', cliente.email)

    // 🔥 CRIAR PREFERÊNCIA DE PAGAMENTO
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: `order-${pedidoId}`,
          title: `Pedido #${pedidoId} - PREPARADO`,
          description: descricao || `Pedido #${pedidoId}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(valor)
        }],
        payer: {
          email: cliente.email,
          name: cliente.nome || 'Cliente'
        },
        payment_methods: {
          installments: 12,
          default_installments: 1
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/loja/pedidos`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/loja/carrinho`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/loja/checkout?order=${pedidoId}`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
        external_reference: `order_${pedidoId}`,
        metadata: {
          pedido_id: pedidoId
        }
      })
    })

    const data = await response.json()
    console.log('📦 Resposta do Mercado Pago:', data)

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao criar preferência'
      }, { status: response.status })
    }

    console.log('✅ Preferência criada:', data.id)

    return NextResponse.json({
      success: true,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    })

  } catch (error) {
    console.error('❌ Erro ao criar pagamento com cartão:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento'
    }, { status: 500 })
  }
}