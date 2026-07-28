import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 Webhook Mercado Pago:', body)

    // 🔥 VERIFICAR SE É PAGAMENTO
    if (body.type === 'payment' || body.action === 'payment.created') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ success: true })
      }

      // Buscar detalhes do pagamento
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      const payment = await response.json()

      console.log('💰 Pagamento:', payment)

      if (payment.status === 'approved') {
        const externalReference = payment.external_reference
        const orderId = externalReference?.replace('order_', '')

        if (orderId) {
          // 🔥 ATUALIZAR PEDIDO
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'paid',
              payment_method: 'pix',
              transaction_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(orderId))

          console.log(`✅ Pedido ${orderId} atualizado para PAGO`)

          // 🔥 VERIFICAR SE TEM PRODUTOS DIGITAIS
          const { data: orderData } = await supabase
            .from('orders')
            .select('user_id, items')
            .eq('id', parseInt(orderId))
            .single()

          if (orderData) {
            const produtosDigitais = orderData.items?.filter((item: any) => item.products?.is_digital) || []

            if (produtosDigitais.length > 0) {
              const { data: userData } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', orderData.user_id)
                .single()

              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', orderData.user_id)
                .single()

              for (const item of produtosDigitais) {
                await enviarEbookPorEmail({
                  email: userData?.email || '',
                  nome: profile?.full_name || 'Usuário',
                  produtoNome: item.products?.name || 'E-book',
                  fileUrl: item.products?.file_url || '',
                  pedidoId: parseInt(orderId)
                })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}