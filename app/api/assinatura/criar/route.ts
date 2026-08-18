import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

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

    // 🔥 Criar assinatura no Mercado Pago (sem trial)
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

    console.log('📤 Enviando para Mercado Pago:', JSON.stringify(subscriptionData, null, 2))

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const data = await response.json()
    console.log('📥 Resposta Mercado Pago:', JSON.stringify(data, null, 2))

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

    // 🔥 Salvar assinatura no banco (ativa imediatamente)
    const now = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    await (supabase
      .from('profiles') as any)
      .update({
        plan_id: planId,
        subscription_status: 'active',
        subscription_id: data.id,
        payment_method: 'card',
        subscription_end_date: endDate.toISOString(),
        trial_start_date: null,
        trial_end_date: null,
      })
      .eq('id', userId)

    await (supabase
      .from('subscriptions') as any)
      .insert([{
        user_id: userId,
        plan_id: planId,
        status: 'active',
        trial_start: null,
        trial_end: null,
        mp_subscription_id: data.id,
        mp_preapproval_id: data.id
      }])

    console.log('✅ Assinatura criada com sucesso!')

    return NextResponse.json({
      success: true,
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
