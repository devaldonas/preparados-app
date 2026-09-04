import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})

export async function POST(request: Request) {
  try {
    const { planId, userId, userEmail, planName, amount, interval, parcelas } = await request.json()

    console.log('📥 Criando checkout no Stripe:', { planId, userId, amount, interval })

    // 🔥 Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${planName} - PREPARADO`,
              description: `Assinatura ${interval} - Acesso completo`,
            },
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: interval === 'year' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/welcome?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos?canceled=true`,
      customer_email: userEmail,
      metadata: {
        plan_id: String(planId || 2),
        user_id: userId,
      },
      // 🔥 CORREÇÃO: Remover 'payment_intent_data' que causa erro
      // Usar 'subscription_data' para assinaturas
      subscription_data: {
        metadata: {
          plan_id: String(planId || 2),
          user_id: userId,
        },
      },
      payment_method_options: {
        boleto: {
          expires_after_days: 3,
        },
      },
    })

    console.log('✅ Checkout criado:', session.id)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar checkout:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar checkout' },
      { status: 500 }
    )
  }
}
