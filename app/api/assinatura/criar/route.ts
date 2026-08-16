import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, planName, price, interval, userId, userEmail } = body

    console.log('📥 Criando assinatura:', { planId, planName, price, interval, userId })

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 Buscar dados do usuário
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('full_name, cpf, email')
      .eq('id', userId)
      .single()

    // 🔥 Criar assinatura no Mercado Pago (pre approval)
    const subscriptionData = {
      reason: `Plano ${planName} - PREPARADO`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: price,
        currency_id: 'BRL'
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/welcome`,
      payer_email: userEmail || profile?.email || 'cliente@email.com',
      external_reference: userId,
      metadata: {
        plan_id: planId,
        plan_name: planName,
        user_id: userId
      }
    }

    console.log('📤 Enviando para Mercado Pago (assinatura):', subscriptionData)

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const data = await response.json()
    console.log('📥 Resposta Mercado Pago:', data)

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return NextResponse.json(
        { success: false, error: data.message || 'Erro ao criar assinatura' },
        { status: response.status }
      )
    }

    // 🔥 Salvar assinatura no banco (trial)
    await (supabase
      .from('profiles') as any)
      .update({
        plan_id: planId,
        subscription_status: 'trial',
        subscription_id: data.id,
        payment_method: 'card',
        subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', userId)

    // 🔥 Salvar na tabela de assinaturas
    await (supabase
      .from('subscriptions') as any)
      .insert([{
        user_id: userId,
        plan_id: planId,
        status: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        mp_subscription_id: data.id,
        mp_preapproval_id: data.id
      }])

    // 🔥 Redirecionar para o Mercado Pago para cadastrar o cartão
    return NextResponse.json({
      success: true,
      initPoint: data.init_point,
      subscriptionId: data.id,
      message: 'Assinatura criada! Redirecione para o Mercado Pago para cadastrar o cartão.'
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
