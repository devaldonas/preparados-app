// app/api/assinatura/webhook/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📦 Webhook recebido:', body)

    // 🔥 CORRIGIDO: usando as any e removendo subscription_status
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({
        plan_id: body.plan_id || 1,
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_id: body.subscription_id || `webhook_${Date.now()}`,
        payment_method: body.payment_method || 'card'
      })
      .eq('id', body.user_id)

    if (updateError) {
      console.error('❌ Erro ao atualizar assinatura:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar assinatura' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}