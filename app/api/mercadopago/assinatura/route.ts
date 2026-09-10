import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const MERCADO_PAGO_PLAN_ID = process.env.MERCADO_PAGO_PLAN_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userEmail, cardTokenId } = body

    console.log('📥 Criando assinatura:', { userId, userEmail, cardTokenId: cardTokenId ? '***' : 'null' })

    if (!userId || !cardTokenId) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN || !MERCADO_PAGO_PLAN_ID) {
      console.error('❌ Token ou plano não configurado')
      return NextResponse.json(
        { success: false, error: 'Configuração incompleta' },
        { status: 500 }
      )
    }

    // 🔥 Buscar dados do usuário
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('full_name, cpf')
      .eq('id', userId)
      .single()

    const userProfile = profile || { full_name: 'Cliente', cpf: '12345678909' }

    // 🔥 Criar a assinatura no Mercado Pago
    const subscriptionData = {
      preapproval_plan_id: MERCADO_PAGO_PLAN_ID,
      card_token_id: cardTokenId,
      payer_email: userEmail,
      external_reference: userId,
      back_url: `${APP_URL}/auth/welcome`,
      status: 'authorized'
    }

    console.log('📤 Enviando assinatura...')

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
      console.error('❌ Erro Mercado Pago:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { success: false, error: data.message || 'Erro ao criar assinatura' },
        { status: response.status }
      )
    }

    console.log('✅ Assinatura criada:', data.id)

    // 🔥 Atualizar o perfil do usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_id: data.id,
        plan_id: 2,
        payment_method: 'credit_card',
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError)
    }

    return NextResponse.json({
      success: true,
      subscriptionId: data.id,
      status: data.status
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
