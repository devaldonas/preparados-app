import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2))

    if (body.type === 'payment' || body.action === 'payment.created') {
      const paymentId = body.data?.id

      if (!paymentId) {
        console.log('⚠️ Payment ID não encontrado no webhook')
        return NextResponse.json({ success: true })
      }

      console.log('🔍 Buscando detalhes do pagamento:', paymentId)

      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
      
      if (!accessToken) {
        console.error('❌ Token do Mercado Pago não configurado')
        return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const payment = await response.json()
      console.log('💰 Pagamento:', payment.status, payment.external_reference)

      if (payment.status === 'approved') {
        const externalReference = payment.external_reference
        const orderId = externalReference?.replace('order_', '')

        console.log('📦 Order ID extraído:', orderId)

        if (orderId) {
          // 🔥 ATUALIZAR PEDIDO
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'paid',
              payment_method: 'pix',
              transaction_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(orderId))

          if (updateError) {
            console.error('❌ Erro ao atualizar pedido:', updateError)
          } else {
            console.log(`✅ Pedido ${orderId} atualizado para PAGO`)
          }

          // 🔥 BUSCAR PRODUTOS DIGITAIS
          const { data: orderData } = await supabase
            .from('orders')
            .select('user_id, items')
            .eq('id', parseInt(orderId))
            .single()

          console.log('📦 OrderData:', orderData)

          if (orderData?.items) {
            const produtosDigitais = orderData.items.filter((item: any) => item.products?.is_digital) || []
            console.log('📦 Produtos digitais encontrados:', produtosDigitais.length)

            if (produtosDigitais.length > 0) {
              // 🔥 BUSCAR E-MAIL DO USUÁRIO
              const { data: userData } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', orderData.user_id)
                .single()

              console.log('📧 E-mail do usuário:', userData?.email)

              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', orderData.user_id)
                .single()

              for (const item of produtosDigitais) {
                console.log('📧 Enviando e-book para:', userData?.email)
                console.log('📚 Produto:', item.products?.name)
                console.log('🔗 Link:', item.products?.file_url)

                const result = await enviarEbookPorEmail({
                  email: userData?.email || '',
                  nome: profile?.full_name || 'Usuário',
                  produtoNome: item.products?.name || 'E-book',
                  fileUrl: item.products?.file_url || '',
                  pedidoId: parseInt(orderId)
                })

                console.log('📧 Resultado do envio:', result)
              }

              console.log(`✅ E-books enviados para ${userData?.email}`)
            } else {
              console.log('⚠️ Nenhum produto digital encontrado no pedido')
            }
          } else {
            console.log('⚠️ OrderData sem items:', orderData)
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