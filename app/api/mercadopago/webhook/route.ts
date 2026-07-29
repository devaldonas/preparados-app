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

          // 🔥 BUSCAR O PEDIDO
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

            // 🔥 BUSCAR OS ITENS
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
              const produtosDigitais = itemsData.filter((item: any) => {
                return item.products?.is_digital === true
              })
              
              console.log('📦 Produtos digitais encontrados:', produtosDigitais.length)

              if (produtosDigitais.length > 0) {
                // 🔥 BUSCAR E-MAIL DIRETAMENTE DO USUÁRIO
                // Usar a função RPC do Supabase para buscar o email
                let userEmail = null
                let userNome = null

                try {
                  // 🔥 MÉTODO 1: Usar a função get_user_email do Supabase
                  const { data: emailData, error: emailError } = await supabase
                    .rpc('get_user_email', { user_id: orderData.user_id })

                  if (!emailError && emailData) {
                    userEmail = emailData
                    console.log('📧 E-mail obtido via RPC:', userEmail)
                  } else {
                    console.log('⚠️ Erro ao buscar email via RPC:', emailError)
                  }
                } catch (rpcError) {
                  console.log('⚠️ Erro na RPC:', rpcError)
                }

                // 🔥 MÉTODO 2: Fallback - buscar da tabela profiles
                if (!userEmail) {
                  const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', orderData.user_id)
                    .single()

                  if (profileData) {
                    userNome = profileData.full_name
                    console.log('👤 Nome via profiles:', userNome)
                  }
                }

                // 🔥 MÉTODO 3: Fallback final - usar o email do pedido
                if (!userEmail) {
                  // Buscar o pedido novamente para pegar o email
                  const { data: orderWithEmail } = await supabase
                    .from('orders')
                    .select('user_id')
                    .eq('id', orderIdNumber)
                    .single()
                  
                  // Tentar usar o auth.users diretamente (funciona em produção)
                  const { data: userData } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', orderData.user_id)
                    .maybeSingle()

                  if (userData?.email) {
                    userEmail = userData.email
                    console.log('📧 E-mail via profiles.email:', userEmail)
                  }
                }

                if (userEmail) {
                  for (const item of produtosDigitais) {
                    console.log('📧 Enviando e-book para:', userEmail)
                    console.log('📚 Produto:', item.products?.name)

                    const result = await enviarEbookPorEmail({
                      email: userEmail,
                      nome: userNome || 'Usuário',
                      produtoNome: item.products?.name || 'E-book',
                      fileUrl: item.products?.file_url || '',
                      pedidoId: orderIdNumber
                    })

                    console.log('📧 Resultado do envio:', result)
                  }

                  console.log(`✅ E-books enviados para ${userEmail}`)
                } else {
                  console.log('❌ Nenhum e-mail encontrado para o usuário:', orderData.user_id)
                }
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