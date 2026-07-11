import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN

export async function POST(request: Request) {
  try {
    const { planId, planName, price, interval, userId, userEmail } = await request.json()

    console.log('💰 Criando assinatura:', { planId, planName, price, interval, userId })

    // 🔥 Criar preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: `plan-${planId}`,
          title: planName,
          description: `Assinatura ${planName} - PREPARADO`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price
        }],
        payer: {
          email: userEmail
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/planos/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/planos/erro`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/planos/pendente`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/assinatura/webhook`,
        metadata: {
          plan_id: planId,
          user_id: userId,
          plan_name: planName,
          interval: interval
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data)
      throw new Error(data.message || 'Erro ao criar preferência')
    }

    console.log('✅ Preferência criada:', data.id)

    return NextResponse.json({
      success: true,
      initPoint: data.init_point,
      preferenceId: data.id
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar assinatura'
    }, { status: 500 })
  }
}