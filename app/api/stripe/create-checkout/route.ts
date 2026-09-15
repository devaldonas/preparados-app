import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      plan,
      userId,
      userEmail,
    } = body

    console.log('📥 Solicitação de checkout Stripe:', {
      plan,
      userId,
      userEmail,
    })

    // Validação básica
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plano inválido.',
        },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não informado.',
        },
        { status: 400 }
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-mail do usuário não informado.',
        },
        { status: 400 }
      )
    }

    // O preço é definido EXCLUSIVAMENTE no servidor.
    const priceId =
      plan === 'monthly'
        ? process.env.STRIPE_PRICE_MENSAL
        : process.env.STRIPE_PRICE_ANUAL

    if (!priceId) {
      console.error(
        '❌ Price ID não configurado para o plano:',
        plan
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Preço do plano não configurado no servidor.',
        },
        { status: 500 }
      )
    }

    console.log('💰 Price ID selecionado:', priceId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      payment_method_types: ['card'],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: userEmail,

      success_url:
        `${process.env.NEXT_PUBLIC_APP_URL}` +
        `/auth/welcome?success=true&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${process.env.NEXT_PUBLIC_APP_URL}` +
        `/planos?canceled=true`,

      metadata: {
        plan_type: plan,
        user_id: String(userId),
      },

      subscription_data: {
        metadata: {
          plan_type: plan,
          user_id: String(userId),
        },
      },
    })

    console.log(
      '✅ Checkout Stripe criado:',
      session.id
    )

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: unknown) {
    console.error(
      '❌ Erro ao criar checkout Stripe:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao criar checkout'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}