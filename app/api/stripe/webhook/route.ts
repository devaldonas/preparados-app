import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

      // 🚫 Ignora checkouts da LOJA — quem trata é o handler de loja (mais abaixo)
      if (session.metadata?.type === 'loja') {
        console.log('⏭️ Checkout da loja ignorado pelo handler de assinatura')
      } else {
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
    }

    /*
     * ============================================================
     * ASSINATURA ATUALIZADA
     * ============================================================
     */

    /*
     * ============================================================
     * CHECKOUT CONCLUÍDO - LOJA (pagamento único)
     * ============================================================
     */
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Se for pagamento da LOJA (não de assinatura)
      if (session.metadata?.type === 'loja') {
        const orderId = session.metadata?.order_id

        console.log('🛒 Checkout da loja concluído:', {
          orderId,
          sessionId: session.id,
          paymentStatus: session.payment_status,
        })

        if (!orderId) {
          console.error('❌ order_id não encontrado no metadata')
          return NextResponse.json({ error: 'order_id ausente' }, { status: 400 })
        }

        // 1. Atualiza o pedido como pago
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'paid',
            transaction_id: session.payment_intent as string || session.id,
            stripe_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (orderError) {
          console.error('❌ Erro ao atualizar pedido:', orderError)
          return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
        }

        // 2. Buscar itens do pedido pra decrementar estoque
        const { data: orderItems } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId)

        // 3. Decrementar estoque de cada item + registrar em stock_history
        for (const item of orderItems || []) {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (product) {
            const oldStock = product.stock || 0
            const newStock = Math.max(0, oldStock - item.quantity)

            // Atualiza o produto
            await supabaseAdmin
              .from('products')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', item.product_id)

            // Registra no histórico
            await supabaseAdmin
              .from('stock_history')
              .insert({
                product_id: item.product_id,
                old_stock: oldStock,
                new_stock: newStock,
                change_type: 'venda',
                user_id: session.metadata?.user_id || null,
                notes: `Venda via Stripe - Pedido #${orderId}`,
              })
          }
        }

        // 4. Limpar carrinho do usuário
        if (session.metadata?.user_id) {
          await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', session.metadata.user_id)
        }

        console.log('✅ Pedido da loja processado com sucesso:', orderId)
      }
    }

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