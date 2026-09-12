import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .maybeSingle()

    const isActive = profile?.subscription_status === 'active'

    const response = NextResponse.json({
      success: true,
      subscription_status: profile?.subscription_status || 'trial',
      isActive
    })

    // 🔥 Setar o cookie de assinatura ativa
    if (isActive) {
      response.cookies.set('sb-subscription-active', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    } else {
      response.cookies.delete('sb-subscription-active')
    }

    return response
  } catch (error) {
    console.error('❌ Erro ao setar cookie:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
