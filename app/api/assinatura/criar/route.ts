import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🔥 USAR TOKEN DE TESTE
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST

console.log('🚀 Usando token de TESTE (sandbox)')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, planName, userId, userEmail, paymentMethod, parcelas } = body

    console.log('📥 Dados recebidos:', { planId, planName, userId, paymentMethod, parcelas })

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('❌ Token de teste não configurado')
      return NextResponse.json(
        { error: 'Token do Mercado Pago não configurado' },
        { status: 500 }
      )
    }

    // 🔥 VALOR FIXO PARA TESTE - R$ 100,00
    const valorTotal = 100.00
    const valorParcela = 8.34

    console.log('💰 Valor total:', valorTotal)
    console.log('💰 Valor parcela:', valorParcela)

    // 🔥 Buscar dados do usuário
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('full_name, cpf, email')
      .eq('id', userId)
      .single()

    console.log('👤 Usuário:', profile?.full_name)

    // 🔥 Se for PIX
    if (paymentMethod === 'pix') {
      const pixData = {
        transaction_amount: valorTotal,
        description: `Plano ${planName} - PREPARADO (TESTE)`,
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
        },
        notification_url: `${APP_URL}/api/mercadopago/webhook`
      }

      console.log('📤 Enviando PIX...')

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
      console.log('📥 Status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Erro:', JSON.stringify(data, null, 2))
        return NextResponse.json(
          { success: false, error: data.message || 'Erro ao gerar PIX' },
          { status: response.status }
        )
      }

      let qrCode = null
      let codigoPix = null
      
      if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
        qrCode = `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`
      }
      codigoPix = data.point_of_interaction?.transaction_data?.qr_code || null

      return NextResponse.json({
        success: true,
        paymentMethod: 'pix',
        qrCode: qrCode,
        codigoPix: codigoPix,
        paymentId: data.id
      })
    }

    // 🔥 Se for cartão
    const subscriptionData = {
      reason: `Plano ${planName} - PREPARADO (TESTE)`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: valorParcela,
        currency_id: 'BRL'
      },
      back_url: `${APP_URL}/auth/welcome`,
      payer_email: userEmail || profile?.email || 'cliente@email.com',
      external_reference: userId,
      metadata: {
        plan_id: planId,
        plan_name: planName,
        user_id: userId,
        parcelas: parcelas || 1,
        total_amount: valorTotal,
        test: true
      },
      notification_url: `${APP_URL}/api/mercadopago/webhook`
    }

    console.log('📤 Enviando assinatura para Mercado Pago...')

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const data = await response.json()
    console.log('📥 Status:', response.status)

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json(
        { success: false, error: data.message || 'Erro ao criar assinatura' },
        { status: response.status }
      )
    }

    console.log('✅ Assinatura criada com sucesso!')

    return NextResponse.json({
      success: true,
      paymentMethod: 'card',
      initPoint: data.init_point,
      subscriptionId: data.id
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
