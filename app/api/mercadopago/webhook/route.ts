import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    console.log('🚀 WEBHOOK - INICIADO')
    
    const rawBody = await request.text()
    console.log('📦 Raw Body:', rawBody)

    if (!rawBody) {
      console.log('⚠️ Body vazio')
      return NextResponse.json({ error: 'Body vazio' }, { status: 400 })
    }

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

      const externalReference = order.external_reference || ''

      // 🔥 PROCESSAR ASSINATURA
      if (externalReference.includes('plan_')) {
        const userId = externalReference.replace('plan_2_user_', '')
        if (userId) {
          const isPaid = order.payments?.some((p: any) => p.status === 'approved')
          
          if (isPaid) {
            console.log(`✅ Assinatura aprovada para: ${userId}`)
            
            // 🔥 ATUALIZAR APENAS COLUNAS QUE EXISTEM
            const { data, error: updateError } = await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                plan_id: 2,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
              .select()

            if (updateError) {
              console.error('❌ Erro ao atualizar perfil:', updateError)
              return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
            }

            console.log('✅ Perfil atualizado:', data)
            return NextResponse.json({ success: true, userId })
          } else {
            console.log(`⏳ Pagamento ainda não aprovado`)
          }
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
