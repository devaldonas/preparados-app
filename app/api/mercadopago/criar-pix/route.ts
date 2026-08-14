import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, amount, description } = body

    console.log('📥 PIX - Dados recebidos:', { orderId, amount, description })

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    // 🔥 Buscar o pedido com a chave de serviço
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const url = `${supabaseUrl}/rest/v1/orders?select=*&id=eq.${orderId}`
    
    const response = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao buscar pedido' },
        { status: response.status }
      )
    }

    const orders = await response.json()
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: `Pedido ${orderId} não encontrado` },
        { status: 404 }
      )
    }

    const order = orders[0]

    // 🔥 Buscar email do usuário
    let userEmail = 'cliente@email.com'
    try {
      const { data: userData } = await fetch(
        `${supabaseUrl}/rest/v1/auth/users?select=email&id=eq.${order.user_id}`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      ).then(res => res.json())

      if (userData?.[0]?.email) {
        userEmail = userData[0].email
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar email:', error)
    }

    console.log('📧 Email do usuário:', userEmail)

    // 🔥 Dados do PIX no Mercado Pago (com CPF válido)
    const pixData = {
      transaction_amount: parseFloat(amount) || parseFloat(order.total_amount),
      description: description || `Pedido #${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: 'Cliente',
        last_name: 'Teste',
        identification: {
          type: 'CPF',
          number: '12345678909'  // 🔥 CPF válido para teste
        }
      }
    }

    console.log('📤 Enviando para Mercado Pago:', JSON.stringify(pixData, null, 2))

    // 🔥 GERAR PIX NO MERCADO PAGO
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`
      },
      body: JSON.stringify(pixData)
    })

    const mpData = await mpResponse.json()
    console.log('📥 Resposta do Mercado Pago:', JSON.stringify(mpData, null, 2))

    if (!mpResponse.ok) {
      console.error('❌ Erro Mercado Pago:', mpData)
      return NextResponse.json(
        { error: mpData.message || 'Erro ao gerar PIX' },
        { status: mpResponse.status }
      )
    }

    // Atualizar pedido
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        transaction_id: mpData.id,
        payment_status: 'pending',
        payment_method: 'pix'
      })
    })

    return NextResponse.json({
      success: true,
      qrCode: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      codigoPix: mpData.point_of_interaction?.transaction_data?.qr_code || null,
      paymentId: mpData.id
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar PIX. Tente novamente.' },
      { status: 500 }
    )
  }
}
