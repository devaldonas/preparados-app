import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 Webhook recebido:', body)

    // 🔥 Verificar se é pagamento aprovado
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id

      // Buscar detalhes do pagamento
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      const payment = await response.json()

      if (payment.status === 'approved') {
        const { plan_id, user_id, interval } = payment.metadata

        console.log(`✅ Pagamento aprovado:`, { plan_id, user_id, interval })

        // 🔥 Atualizar perfil do usuário
        const now = new Date()
        let endDate = new Date()
        
        if (interval === 'year') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          endDate.setMonth(endDate.getMonth() + 1)
        }

        await supabase
          .from('profiles')
          .update({
            plan_id: plan_id,
            subscription_status: 'active',
            trial_end_date: null,
            subscription_end_date: endDate.toISOString(),
            subscription_id: paymentId,
            payment_method: 'mercadopago'
          })
          .eq('id', user_id)

        console.log(`✅ Perfil do usuário ${user_id} atualizado`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}