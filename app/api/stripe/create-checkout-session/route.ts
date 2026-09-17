import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId não informado' },
        { status: 400 }
      )
    }

    console.log('📥 Criando checkout Stripe pra loja. Order:', orderId)

    // ============================================================
    // 1. Buscar pedido + itens + dados do usuário
    // ============================================================
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Pedido não encontrado:', orderError)
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Pedido já está pago' },
        { status: 400 }
      )
    }

    // ============================================================
    // 2. Buscar dados do usuário (nome, email)
    // ============================================================
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', order.user_id)
      .single()

    const customerEmail = profile?.email || order.email
    const customerName = profile?.full_name || order.customer_name || 'Cliente'

    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'E-mail do cliente não encontrado' },
        { status: 400 }
      )
    }

    // ============================================================
    // 3. Montar line_items do Stripe
    // ============================================================
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const item of order.items || []) {
      const product = item.product
      if (!product) continue

      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: product.name,
            description: product.description?.substring(0, 200) || undefined,
            images: product.image_url ? [product.image_url] : undefined,
          },
          unit_amount: Math.round(Number(item.price) * 100), // centavos
        },
        quantity: item.quantity,
      })
    }

    // Adiciona o frete como item separado (se houver)
    const shippingCost = Number(order.shipping_cost) || 0
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Frete',
            description: 'Custo de entrega',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      })
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido sem itens válidos' },
        { status: 400 }
      )
    }

    // ============================================================
    // 4. Aplicar desconto de créditos (se houver)
    // ============================================================
    const discountAmount = Number(order.discount_amount) || 0
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined

    if (discountAmount > 0) {
      // Cria um cupom dinâmico no Stripe
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'brl',
        duration: 'once',
        name: 'Créditos da carteira',
      })

      discounts = [{ coupon: coupon.id }]
    }

    // ============================================================
    // 5. Criar a sessão no Stripe
    // ============================================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: customerEmail,
      discounts,
      success_url: `${appUrl}/loja/pedidos/${orderId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/loja/checkout?order=${orderId}&canceled=true`,
      metadata: {
        order_id: String(orderId),
        user_id: String(order.user_id),
        customer_name: customerName,
        type: 'loja', // identifica no webhook que é pagamento de loja
      },
      payment_intent_data: {
        metadata: {
          order_id: String(orderId),
          user_id: String(order.user_id),
          type: 'loja',
        },
      },
    })

    // ============================================================
    // 6. Salvar session_id no pedido
    // ============================================================
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        stripe_session_id: session.id,
        payment_method: 'stripe',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Erro ao salvar session_id:', updateError)
      // Não retorna erro — a sessão já foi criada, o usuário consegue pagar
    }

    console.log('✅ Sessão Stripe criada:', session.id)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: unknown) {
    console.error('❌ Erro ao criar sessão Stripe:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
