import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Configuração do Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const MERCADO_PAGO_PUBLIC_KEY = process.env.MERCADO_PAGO_PUBLIC_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, amount, description } = body

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar pedido e usuário
    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError)
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // 🔥 Buscar email do usuário
    let userEmail = 'cliente@email.com'
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.email) {
        userEmail = userData.user.email
      }
    } catch (error) {
      console.warn('Erro ao buscar email do usuário:', error)
    }

    // Dados do PIX
    const pixData = {
      transaction_amount: amount,
      description: description || `Pedido #${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: order.user?.full_name || 'Cliente',
        identification: {
          type: 'CPF',
          number: '12345678900' // Pode ser um CPF genérico
        }
      }
    }

    console.log('📤 Enviando para Mercado Pago:', pixData)

    // Gerar PIX no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`
      },
      body: JSON.stringify(pixData)
    })

    const data = await response.json()
    console.log('📥 Resposta do Mercado Pago:', data)

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data)
      return NextResponse.json(
        { error: data.message || 'Erro ao gerar PIX' },
        { status: response.status }
      )
    }

    // Atualizar pedido com o ID da transação
    await (supabase
      .from('orders') as any)
      .update({
        transaction_id: data.id,
        payment_status: 'pending',
        payment_method: 'pix'
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      codigoPix: data.point_of_interaction?.transaction_data?.qr_code || null,
      paymentId: data.id
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar PIX. Tente novamente.' },
      { status: 500 }
    )
  }
}
