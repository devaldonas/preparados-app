import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Erro ao verificar assinatura:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('📥 Webhook recebido:', event.type)

  try {
    // 🔥 ASSINATURA CRIADA
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const planId = session.metadata?.plan_id

      console.log('✅ Pagamento concluído:', { userId, planId })

      if (userId) {
        // 🔥 Atualizar o status da assinatura
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            plan_id: Number(planId) || 2,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Erro ao atualizar perfil:', error)
          return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
        }

        console.log('✅ Assinatura ativada para:', userId)
      }
    }

    // 🔥 ASSINATURA CANCELADA
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log('❌ Assinatura cancelada para:', userId)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
