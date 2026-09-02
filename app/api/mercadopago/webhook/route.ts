import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    console.log('🚀 WEBHOOK - INICIADO')
    
    // 🔥 LER O BODY
    const rawBody = await request.text()
    console.log('📦 Raw Body:', rawBody)

    if (!rawBody) {
      console.log('⚠️ Body vazio')
      return NextResponse.json({ error: 'Body vazio' }, { status: 400 })
    }

    // 🔥 PARSEAR JSON
    let body
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('❌ JSON inválido:', parseError)
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    console.log('📌 Body:', JSON.stringify(body, null, 2))

    // 🔥 EXTRAIR O ID DA URL (resource)
    let id = body.id || body.data?.id
    
    // 🔥 SE NÃO TIVER ID DIRETO, EXTRAIR DA URL
    if (!id && body.resource) {
      const parts = body.resource.split('/')
      id = parts[parts.length - 1]
      console.log(`🔍 ID extraído da URL: ${id}`)
    }

    if (!id) {
      console.log('⚠️ ID não encontrado')
      return NextResponse.json({ error: 'ID não encontrado' }, { status: 400 })
    }

    console.log(`📌 ID: ${id}`)

    // 🔥 TOKEN
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('❌ Token não configurado')
      return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
    }

    // 🔥 PROCESSAR MERCHANT_ORDER
    if (body.topic === 'merchant_order') {
      console.log(`📦 Buscando ordem #${id} no Mercado Pago...`)

      const response = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        console.error('❌ Erro na API do MP:', response.status)
        const errorText = await response.text()
        console.error('📄 Erro:', errorText)
        return NextResponse.json({ error: 'Erro na API do MP' }, { status: response.status })
      }

      const order = await response.json()
      console.log('✅ Ordem encontrada:', {
        id: order.id,
        status: order.order_status,
        external_reference: order.external_reference,
        payments: order.payments?.length || 0,
        payment_status: order.payments?.map((p: any) => ({ id: p.id, status: p.status }))
      })

      // 🔥 VERIFICAR EXTERNAL_REFERENCE
      const externalReference = order.external_reference || ''

      // 🔥 PROCESSAR PEDIDO DA LOJA
      if (externalReference.includes('order_')) {
        const orderId = Number(externalReference.replace('order_', ''))
        if (!isNaN(orderId)) {
          const isPaid = order.payments?.some((p: any) => p.status === 'approved')
          
          if (isPaid) {
            console.log(`✅ Pedido #${orderId} aprovado!`)
            
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                status: 'processing',
                transaction_id: String(id),
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId)

            if (updateError) {
              console.error('❌ Erro ao atualizar pedido:', updateError)
              return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
            }

            console.log(`✅ Pedido #${orderId} atualizado para PAID!`)
            return NextResponse.json({ success: true, orderId })
          } else {
            console.log(`⏳ Pedido #${orderId} ainda não aprovado`)
            return NextResponse.json({ success: true, status: 'pending' })
          }
        }
      }

      // 🔥 PROCESSAR ASSINATURA
      if (externalReference.includes('plan_')) {
        const userId = externalReference.replace('plan_2_user_', '')
        if (userId) {
          const isPaid = order.payments?.some((p: any) => p.status === 'approved')
          
          if (isPaid) {
            console.log(`✅ Assinatura aprovada para: ${userId}`)
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                plan_id: 2
              })
              .eq('id', userId)

            if (updateError) {
              console.error('❌ Erro ao atualizar perfil:', updateError)
              return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
            }

            console.log(`✅ Assinatura ativada para: ${userId}`)
            return NextResponse.json({ success: true, userId })
          }
        }
      }

      return NextResponse.json({ success: true })
    }

    // 🔥 PROCESSAR PAYMENT
    if (body.topic === 'payment') {
      console.log(`💳 Buscando pagamento #${id}...`)

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        console.error('❌ Erro na API do MP:', response.status)
        return NextResponse.json({ error: 'Erro na API do MP' }, { status: response.status })
      }

      const payment = await response.json()
      console.log('✅ Pagamento:', { 
        id: payment.id, 
        status: payment.status, 
        external_reference: payment.external_reference 
      })

      // 🔥 PROCESSAR ASSINATURA
      const externalReference = payment.external_reference || ''
      
      if (externalReference.includes('plan_') && payment.status === 'approved') {
        const userId = externalReference.replace('plan_2_user_', '')
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              plan_id: 2
            })
            .eq('id', userId)
          console.log(`✅ Assinatura ativada para: ${userId}`)
        }
      }

      return NextResponse.json({ success: true })
    }

    console.log('⚠️ Evento não reconhecido:', body.topic)
    return NextResponse.json({ success: false, message: 'Evento não reconhecido' }, { status: 200 })

  } catch (error) {
    console.error('❌ ERRO FATAL no webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
