import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'session_id não informado',
        },
        { status: 400 }
      )
    }

    console.log(
      '🔎 Verificando Checkout Session:',
      sessionId
    )

    const session =
      await stripe.checkout.sessions.retrieve(sessionId)

    console.log('📦 Checkout Session:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      userId: session.metadata?.user_id,
      planType: session.metadata?.plan_type,
    })

    if (session.status !== 'complete') {
      return NextResponse.json(
        {
          success: false,
          error: 'Checkout ainda não foi concluído.',
          status: session.status,
          payment_status: session.payment_status,
        },
        { status: 400 }
      )
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'Pagamento ainda não foi confirmado.',
          payment_status: session.payment_status,
        },
        { status: 400 }
      )
    }

    const userId = session.metadata?.user_id

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'user_id não encontrado no Checkout Session.',
        },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select(
          'id, full_name, subscription_status, subscription_id, plan_id, payment_method, subscription_end_date'
        )
        .eq('id', userId)
        .single()

    if (profileError) {
      console.error(
        '❌ Erro ao buscar perfil:',
        profileError
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar perfil do usuário.',
        },
        { status: 500 }
      )
    }

    console.log('👤 Perfil encontrado:', profile)

    return NextResponse.json({
      success: true,

      user: {
        id: profile.id,
        full_name: profile.full_name,
      },

      subscription: {
        status: profile.subscription_status,
        subscription_id: profile.subscription_id,
        plan_id: profile.plan_id,
        payment_method: profile.payment_method,
        subscription_end_date:
          profile.subscription_end_date,
      },

      stripe: {
        session_id: session.id,
        payment_status: session.payment_status,
      },
    })
  } catch (error: unknown) {
    console.error(
      '❌ Erro ao verificar Checkout Session:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao verificar pagamento.',
      },
      { status: 500 }
    )
  }
}