import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, planName, price, interval, userId, userEmail, paymentMethod } = body

    console.log('📥 Criando assinatura:', { planId, planName, price, interval, userId, paymentMethod })

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não configurado')
      return NextResponse.json(
        { error: 'Token do Mercado Pago não configurado' },
        { status: 500 }
      )
    }

    // 🔥 Buscar dados do usuário
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('full_name, cpf, email')
      .eq('id', userId)
      .single()

    // 🔥 Se for PIX, criar pagamento único (não assinatura)
    if (paymentMethod === 'pix') {
      const pixData = {
        transaction_amount: 476.28,
        description: 'Plano Anual - PREPARADO (PIX)',
        payment_method_id: 'pix',
        payer: {
          email: userEmail || profile?.email || 'cliente@email.com',
          first_name: profile?.full_name || 'Cliente',
          identification: {
            type: 'CPF',
            number: '12345678909'
          }
        },
        metadata: {
          plan_id: planId,
          plan_name: planName,
          user_id: userId,
          payment_type: 'pix'
        }
      }

      console.log('📤 Enviando PIX para Mercado Pago:', JSON.stringify(pixData, null, 2))

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${userId}-${Date.now()}`
        },
        body: JSON.stringify(pixData)
      })

      const data = await response.json()
      console.log('📥 Resposta Mercado Pago (PIX):', JSON.stringify(data, null, 2))

      if (!response.ok) {
        console.error('❌ Erro Mercado Pago:', data)
        return NextResponse.json(
          { 
            success: false, 
            error: data.message || 'Erro ao gerar PIX',
            details: data
          },
          { status: response.status }
        )
      }

      // 🔥 Salvar PIX no banco
      await (supabase
        .from('profiles') as any)
        .update({
          plan_id: planId,
          subscription_status: 'pending_payment',
          subscription_id: data.id,
          payment_method: 'pix',
          subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId)

      return NextResponse.json({
        success: true,
        paymentMethod: 'pix',
        qrCode: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        codigoPix: data.point_of_interaction?.transaction_data?.qr_code || null,
        paymentId: data.id,
        message: 'PIX gerado com sucesso!'
      })
    }

    // 🔥 Se for cartão, criar assinatura no Mercado Pago
    const subscriptionData = {
      reason: `Plano Anual - PREPARADO`,
      auto_recurring: {
        frequency: 12,
        frequency_type: 'months',
        transaction_amount: 39.69,
        currency_id: 'BRL'
      },
      back_url: `${APP_URL}/auth/welcome`,
      payer_email: userEmail || profile?.email || 'cliente@email.com',
      external_reference: userId,
      metadata: {
        plan_id: planId,
        plan_name: planName,
        user_id: userId
      }
    }

    console.log('📤 Enviando assinatura para Mercado Pago:', JSON.stringify(subscriptionData, null, 2))

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const data = await response.json()
    console.log('📥 Resposta Mercado Pago (cartão):', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json(
        { 
          success: false, 
          error: data.message || 'Erro ao criar assinatura',
          details: data
        },
        { status: response.status }
      )
    }

    // 🔥 Salvar assinatura no banco
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    await (supabase
      .from('profiles') as any)
      .update({
        plan_id: planId,
        subscription_status: 'active',
        subscription_id: data.id,
        payment_method: 'card',
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      paymentMethod: 'card',
      initPoint: data.init_point,
      subscriptionId: data.id,
      message: 'Assinatura criada!'
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        message: 'Erro interno ao criar assinatura'
      },
      { status: 500 }
    )
  }
}
