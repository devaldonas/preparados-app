import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🔥 Usar credenciais de teste em desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development'
const MERCADO_PAGO_ACCESS_TOKEN = isDevelopment 
  ? process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST 
  : process.env.MERCADO_PAGO_ACCESS_TOKEN

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📦 Webhook recebido do Mercado Pago:', JSON.stringify(body, null, 2))
    console.log('🔑 Modo:', isDevelopment ? '🧪 TESTE' : '🚀 PRODUÇÃO')

    const { type, data } = body

    if (type !== 'payment') {
      console.log('ℹ️ Evento ignorado:', type)
      return NextResponse.json({ success: true })
    }

    const paymentId = data.id
    console.log('💰 Payment ID:', paymentId)

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const payment = await mpResponse.json()
    console.log('📥 Detalhes do pagamento:', JSON.stringify(payment, null, 2))

    if (payment.status === 'approved') {
      const userId = payment.metadata?.user_id || payment.external_reference
      
      if (!userId) {
        console.log('❌ User ID não encontrado no pagamento')
        return NextResponse.json({ success: false }, { status: 400 })
      }

      console.log('👤 Usuário ID:', userId)

      const subscriptionEndDate = new Date()
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          subscription_status: 'active',
          subscription_id: payment.id,
          payment_method: payment.payment_method_id || 'pix',
          subscription_end_date: subscriptionEndDate.toISOString(),
          plan_id: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar perfil' },
          { status: 500 }
        )
      }

      await (supabase
        .from('orders') as any)
        .update({
          payment_status: 'paid',
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', payment.id)

      await (supabase
        .from('subscriptions') as any)
        .upsert({
          user_id: userId,
          plan_id: 1,
          status: 'active',
          mp_subscription_id: payment.id,
          trial_start: null,
          trial_end: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'mp_subscription_id'
        })

      console.log('✅ Usuário atualizado com sucesso!', { userId, status: 'active' })
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      console.log('❌ Pagamento não aprovado:', payment.status)
      const userId = payment.metadata?.user_id || payment.external_reference
      
      if (userId) {
        await (supabase
          .from('profiles') as any)
          .update({
            subscription_status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
