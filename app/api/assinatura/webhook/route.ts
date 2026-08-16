import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📦 Webhook de assinatura recebido:', body)

    const { type, data } = body

    if (type === 'preapproval' && data) {
      const { id, status, external_reference } = data

      console.log(`📦 Assinatura ${id} - Status: ${status}`)

      if (status === 'authorized' || status === 'active') {
        // 🔥 Atualizar assinatura como ativa
        await (supabase
          .from('profiles') as any)
          .update({
            subscription_status: 'active',
            subscription_id: id
          })
          .eq('id', external_reference)

        // 🔥 Atualizar tabela de subscriptions
        await (supabase
          .from('subscriptions') as any)
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('mp_subscription_id', id)
      }

      if (status === 'cancelled') {
        // 🔥 Cancelar assinatura
        await (supabase
          .from('profiles') as any)
          .update({
            subscription_status: 'cancelled'
          })
          .eq('subscription_id', id)
      }
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
