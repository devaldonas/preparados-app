import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Webhook Play Store:', body)

    // 🔥 Processar notificação da Play Store
    const { purchaseToken, orderId, userId, productId } = body

    if (!purchaseToken || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 Atualizar perfil do usuário
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        acesso_gratuito_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
      return NextResponse.json(
        { error: 'Erro ao processar assinatura' },
        { status: 500 }
      )
    }

    console.log('✅ Assinatura Play Store processada com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Assinatura processada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
