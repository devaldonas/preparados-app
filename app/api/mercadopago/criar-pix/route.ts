import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { pedidoId, valor, descricao, cliente } = await request.json()

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({
        success: false,
        error: 'Token do Mercado Pago não configurado'
      }, { status: 500 })
    }

    // 🔥 GARANTIR QUE A URL ESTÁ CORRETA E COM HTTPS
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'
    // 🔥 REMOVER BARRA NO FINAL SE EXISTIR
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const webhookUrl = `${cleanBaseUrl}/api/mercadopago/webhook`
    
    console.log('🔗 Base URL:', cleanBaseUrl)
    console.log('🔗 Webhook URL:', webhookUrl)
    console.log('💰 Criando pagamento PIX para pedido:', pedidoId)
    console.log('💰 Valor:', valor)
    console.log('📧 E-mail:', cliente.email)

    // 🔥 VALIDAR A URL
    try {
      new URL(webhookUrl)
      console.log('✅ URL válida:', webhookUrl)
    } catch (urlError) {
      console.error('❌ URL inválida:', webhookUrl)
      throw new Error(`URL do webhook inválida: ${webhookUrl}`)
    }

    // 🔥 CRIAR PAGAMENTO PIX DIRETO
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${pedidoId}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: descricao || `Pedido #${pedidoId} - PREPARADO`,
        payment_method_id: 'pix',
        payer: {
          email: cliente.email,
          first_name: cliente.nome || 'Cliente'
        },
        notification_url: webhookUrl,
        metadata: {
          pedido_id: pedidoId
        },
        external_reference: `order_${pedidoId}`
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao criar pagamento PIX:', data)
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao criar pagamento PIX'
      }, { status: response.status })
    }

    console.log('✅ Pagamento PIX criado:', data.id)

    return NextResponse.json({
      success: true,
      paymentId: data.id,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      qrCodeText: data.point_of_interaction?.transaction_data?.qr_code || null,
      valor: data.transaction_amount,
      status: data.status
    })

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento PIX'
    }, { status: 500 })
  }
}