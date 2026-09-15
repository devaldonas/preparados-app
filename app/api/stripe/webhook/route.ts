import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('❌ Stripe-Signature não encontrado')
    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Erro ao verificar assinatura:', err)

    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log('📥 Webhook recebido:', event.type)

  try {
    /*
     * ============================================================
     * CHECKOUT CONCLUÍDO
     * ============================================================
     */
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.user_id
      const planType = session.metadata?.plan_type

      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

      console.log('✅ Checkout concluído:', {
        userId,
        planType,
        subscriptionId,
      })

      if (!userId) {
        console.error(
          '❌ user_id não encontrado no metadata do Checkout'
        )

        return NextResponse.json(
          { error: 'user_id não encontrado' },
          { status: 400 }
        )
      }

      /*
       * Plano:
       * monthly = plano 1
       * annual  = plano 2
       */
      const planId = planType === 'monthly' ? 1 : 2

      /*
       * O Checkout está em modo subscription.
       * Buscamos a assinatura no Stripe para obter
       * o período real da assinatura.
       */
      let subscriptionEndDate: string | null = null

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId)

        const endTimestamp =
          subscription.items.data[0]?.current_period_end

        if (endTimestamp) {
          subscriptionEndDate =
            new Date(endTimestamp * 1000).toISOString()
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_id: subscriptionId ?? null,
          plan_id: planId,
          payment_method: 'stripe',
          subscription_end_date: subscriptionEndDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error(
          '❌ Erro ao atualizar perfil:',
          error
        )

        return NextResponse.json(
          { error: 'Erro ao atualizar perfil' },
          { status: 500 }
        )
      }

      console.log(
        '✅ Assinatura ativada com sucesso para:',
        userId
      )
    }

    /*
     * ============================================================
     * ASSINATURA ATUALIZADA
     * ============================================================
     */
    if (event.type === 'customer.subscription.updated') {
      const subscription =
        event.data.object as Stripe.Subscription

      const userId = subscription.metadata?.user_id

      console.log('🔄 Assinatura atualizada:', {
        userId,
        subscriptionId: subscription.id,
        status: subscription.status,
      })

      if (userId) {
        const currentPeriodEnd =
          subscription.items.data[0]?.current_period_end

        const subscriptionEndDate = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null

        let status = 'inactive'

        if (
          subscription.status === 'active' ||
          subscription.status === 'trialing'
        ) {
          status = 'active'
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_id: subscription.id,
            subscription_end_date: subscriptionEndDate,
            payment_method: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error(
            '❌ Erro ao atualizar assinatura:',
            error
          )

          return NextResponse.json(
            { error: 'Erro ao atualizar assinatura' },
            { status: 500 }
          )
        }

        console.log(
          '✅ Assinatura atualizada no perfil:',
          userId
        )
      }
    }

    /*
     * ============================================================
     * ASSINATURA CANCELADA
     * ============================================================
     */
    if (event.type === 'customer.subscription.deleted') {
      const subscription =
        event.data.object as Stripe.Subscription

      const userId = subscription.metadata?.user_id

      console.log('❌ Assinatura cancelada:', {
        userId,
        subscriptionId: subscription.id,
      })

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            subscription_id: subscription.id,
            payment_method: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error(
            '❌ Erro ao cancelar assinatura:',
            error
          )

          return NextResponse.json(
            { error: 'Erro ao cancelar assinatura' },
            { status: 500 }
          )
        }

        console.log(
          '✅ Assinatura marcada como inativa:',
          userId
        )
      }
    }

    return NextResponse.json({
      received: true,
    })
  } catch (error) {
    console.error(
      '❌ Erro ao processar webhook:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno no webhook',
      },
      { status: 500 }
    )
  }
}