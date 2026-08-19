import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🔥 Usar credenciais de teste em desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development'
const MERCADO_PAGO_ACCESS_TOKEN = isDevelopment 
  ? process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST 
  : process.env.MERCADO_PAGO_ACCESS_TOKEN

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, planName, price, interval, userId, userEmail, paymentMethod } = body

    console.log('📥 Criando assinatura:', { planId, planName, price, interval, userId, paymentMethod })
    console.log('🔑 Modo:', isDevelopment ? '🧪 TESTE' : '🚀 PRODUÇÃO')

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

    // 🔥 Se for PIX
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
          payment_type: 'pix',
          environment: isDevelopment ? 'test' : 'production'
        },
        notification_url: `${APP_URL}/api/mercadopago/webhook`
      }

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

      if (!response.ok) {
        console.error('❌ Erro Mercado Pago:', data)
        return NextResponse.json(
          { 
            success: false, 
            error: data.message || 'Erro ao gerar PIX'
          },
          { status: response.status }
        )
      }

      let qrCode = null
      let codigoPix = null
      
      if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
        qrCode = `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`
      } else if (data.qr_code_base64) {
        qrCode = `data:image/png;base64,${data.qr_code_base64}`
      }
      
      codigoPix = data.point_of_interaction?.transaction_data?.qr_code || null

      await (supabase
        .from('orders') as any)
        .insert([{
          user_id: userId,
          total_amount: 476.28,
          payment_method: 'pix',
          payment_status: 'pending',
          status: 'pending',
          transaction_id: data.id,
          shipping_address: JSON.stringify({})
        }])

      return NextResponse.json({
        success: true,
        paymentMethod: 'pix',
        qrCode: qrCode,
        codigoPix: codigoPix,
        paymentId: data.id,
        message: 'PIX gerado com sucesso!',
        isTest: isDevelopment
      })
    }

    // 🔥 Se for cartão
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
        user_id: userId,
        environment: isDevelopment ? 'test' : 'production'
      },
      notification_url: `${APP_URL}/api/mercadopago/webhook`
    }

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json(
        { 
          success: false, 
          error: data.message || 'Erro ao criar assinatura'
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      paymentMethod: 'card',
      initPoint: data.init_point,
      subscriptionId: data.id,
      message: 'Assinatura criada!',
      isTest: isDevelopment
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: String(error)
      },
      { status: 500 }
    )
  }
}
