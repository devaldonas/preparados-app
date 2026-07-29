import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2))

    if (body.type === 'payment' || body.action === 'payment.updated') {
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
        const externalReference = payment.external_reference || ''
        console.log('📦 External Reference:', externalReference)

        let orderId = null
        
        if (externalReference.includes('order_')) {
          orderId = externalReference.replace('order_', '')
        } else if (externalReference.includes('pedido_')) {
          orderId = externalReference.replace('pedido_', '')
        } else if (/^\d+$/.test(externalReference)) {
          orderId = externalReference
        }

        console.log('📦 Order ID extraído:', orderId)

        if (orderId) {
          const orderIdNumber = parseInt(orderId, 10)
          
          if (isNaN(orderIdNumber)) {
            console.error('❌ Order ID inválido:', orderId)
            return NextResponse.json({ success: true })
          }

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
            .eq('id', orderIdNumber)

          if (updateError) {
            console.error('❌ Erro ao atualizar pedido:', updateError)
          } else {
            console.log(`✅ Pedido ${orderIdNumber} atualizado para PAGO`)
          }

          // 🔥 BUSCAR O PEDIDO PRIMEIRO
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('user_id')
            .eq('id', orderIdNumber)
            .single()

          if (orderError) {
            console.error('❌ Erro ao buscar pedido:', orderError)
          }

          if (orderData) {
            console.log('📦 Pedido encontrado:', orderData)

            // 🔥 BUSCAR OS ITENS DO PEDIDO SEPARADAMENTE
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                *,
                products:product_id (
                  id,
                  name,
                  is_digital,
                  file_url,
                  price
                )
              `)
              .eq('order_id', orderIdNumber)

            if (itemsError) {
              console.error('❌ Erro ao buscar itens:', itemsError)
            }

            console.log('📦 Itens encontrados:', itemsData?.length || 0)

            if (itemsData && itemsData.length > 0) {
              // 🔥 FILTRAR PRODUTOS DIGITAIS
              const produtosDigitais = itemsData.filter((item: any) => {
                console.log('📦 Item:', item.product_id, item.products?.name, 'is_digital:', item.products?.is_digital)
                return item.products?.is_digital === true
              })
              
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
                    pedidoId: orderIdNumber
                  })

                  console.log('📧 Resultado do envio:', result)
                }

                console.log(`✅ E-books enviados para ${userData?.email}`)
              } else {
                console.log('⚠️ Nenhum produto digital encontrado no pedido')
              }
            } else {
              console.log('⚠️ Nenhum item encontrado no pedido')
            }
          } else {
            console.log('⚠️ Pedido não encontrado:', orderIdNumber)
          }
        } else {
          console.log('⚠️ Não foi possível extrair o Order ID do external_reference:', externalReference)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}