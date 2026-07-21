import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 Webhook recebido:', body)

    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id

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

        // Atualizar perfil
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

        // 🔥 BUSCAR PRODUTOS DIGITAIS DO PEDIDO
        const { data: pedido } = await supabase
          .from('orders')
          .select('id, user_id, items')
          .eq('transaction_id', payment.external_reference)
          .single()

        if (pedido && pedido.items) {
          // Buscar produtos digitais
          const produtosDigitaiz = pedido.items.filter((item: any) => item.products?.is_digital)

          if (produtosDigitaiz.length > 0) {
            // Buscar e-mail do usuário
            const { data: userData } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', user_id)
              .single()

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user_id)
              .single()

            // 🔥 ENVIAR E-MAIL PARA CADA PRODUTO DIGITAL
            for (const item of produtosDigitaiz) {
              await enviarEbookPorEmail({
                email: userData?.email || '',
                nome: profile?.full_name || 'Usuário',
                produtoNome: item.products?.name || 'E-book',
                fileUrl: item.products?.file_url || '',
                pedidoId: pedido.id
              })
            }

            console.log(`✅ E-books enviados para ${userData?.email}`)
          }
        }

        console.log(`✅ Perfil do usuário ${user_id} atualizado`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}