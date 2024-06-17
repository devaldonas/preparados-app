import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { planId, planName, price, interval, userId, userEmail } = await request.json()

    console.log('💰 Criando assinatura:', { planId, planName, price, interval, userId })

    // 🔥 VERIFICAR SE TEM TOKEN REAL DO MERCADO PAGO
    const hasRealToken = process.env.MERCADO_PAGO_ACCESS_TOKEN && 
                         process.env.MERCADO_PAGO_ACCESS_TOKEN !== 'APP_USR-2656840852002581-052123-c1e0f7a02215a40e14fd4991c7088170-226064690'

    if (hasRealToken) {
      // 🔥 USAR MERCADO PAGO REAL
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            id: `plan-${planId}`,
            title: planName,
            description: `Assinatura ${planName} - PREPARADO`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: price
          }],
          payer: {
            email: userEmail
          },
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/planos/sucesso`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/planos/erro`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/planos/pendente`
          },
          auto_return: 'approved',
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/assinatura/webhook`,
          metadata: {
            plan_id: planId,
            user_id: userId,
            plan_name: planName,
            interval: interval
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro Mercado Pago:', data)
        throw new Error(data.message || 'Erro ao criar preferência')
      }

      console.log('✅ Preferência criada:', data.id)

      return NextResponse.json({
        success: true,
        initPoint: data.init_point,
        preferenceId: data.id
      })
    }

    // 🔥 MOCK: Usar quando não tem token real
    console.log('📦 [MOCK] Usando modo de teste sem Mercado Pago')
    
    const now = new Date()
    let endDate = new Date()
    
    if (interval === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    // 🔥 ATUALIZAR APENAS COLUNAS QUE EXISTEM
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_id: planId,
        subscription_status: 'active',
        subscription_id: `mock_${Date.now()}`,
        payment_method: 'mock',
        subscription_end_date: endDate.toISOString(),
        trial_end_date: null
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError)
      throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`)
    }

    console.log('✅ [MOCK] Perfil atualizado para usuário:', userId)

    const mockData = {
      id: `mock_${Date.now()}`,
      init_point: `${process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'}/planos/sucesso?mock=true`
    }

    return NextResponse.json({
      success: true,
      initPoint: mockData.init_point,
      preferenceId: mockData.id
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar assinatura'
    }, { status: 500 })
  }
}