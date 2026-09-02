import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🔥 USAR TOKEN DE TESTE
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST || process.env.MERCADO_PAGO_ACCESS_TOKEN
const IS_SANDBOX = false // 🔥 PRODUÇÃO - USAR TOKEN REAL

console.log(`🚀 Usando token ${IS_SANDBOX ? 'de TESTE (sandbox)' : 'de PRODUÇÃO'}`)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      planId, 
      planName, 
      price, 
      totalPrice, 
      interval, 
      userId, 
      userEmail, 
      paymentMethod, 
      parcelas 
    } = body

    console.log('📥 Dados recebidos:', { planId, planName, userId, paymentMethod, parcelas })

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json(
        { error: 'Token do Mercado Pago não configurado' },
        { status: 500 }
      )
    }

    // 🔥 Buscar dados do usuário (usando campos que existem)
    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .select('full_name, email, cnpj, phone, street, number, city, state')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('⚠️ Erro ao buscar perfil:', profileError.message)
    }

    // 🔥 Criar objeto do usuário com fallbacks
    const userProfile = {
      full_name: profile?.full_name || 'Cliente',
      email: userEmail || profile?.email || 'cliente@email.com',
      // 🔥 Usar CNPJ se disponível, senão usar CPF genérico
      document: profile?.cnpj || '12345678909',
      phone: profile?.phone || '',
      address: profile?.street ? 
        `${profile.street}, ${profile.number || ''} - ${profile.city || ''}, ${profile.state || ''}` : 
        'São Paulo, SP'
    }

    console.log('👤 Perfil:', userProfile)

    // 🔥 SE FOR PIX
    if (paymentMethod === 'pix') {
      const pixData = {
        transaction_amount: Number(totalPrice || 109.64),
        description: `Plano ${planName} - PREPARADO`,
        payment_method_id: 'pix',
        payer: {
          email: userProfile.email,
          first_name: userProfile.full_name?.split(' ')[0] || 'Cliente',
          last_name: userProfile.full_name?.split(' ').slice(1).join(' ') || '',
          identification: {
            type: 'CNPJ', // 🔥 Usar CNPJ se disponível
            number: userProfile.document
          }
        },
        metadata: {
          plan_id: planId,
          plan_name: planName,
          user_id: userId,
          payment_type: 'pix',
          test: IS_SANDBOX
        },
        notification_url: `${APP_URL}/api/mercadopago/webhook`
      }

      console.log('📤 Enviando PIX...')

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${userId}-${Date.now()}`
        },
        body: JSON.stringify(pixData)
      })

      const data = await response.json()
      console.log('📥 Status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Erro PIX:', JSON.stringify(data, null, 2))
        return NextResponse.json(
          { success: false, error: data.message || 'Erro ao gerar PIX' },
          { status: response.status }
        )
      }

      let qrCode = null
      let codigoPix = null
      
      if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
        qrCode = `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`
      }
      codigoPix = data.point_of_interaction?.transaction_data?.qr_code || null

      return NextResponse.json({
        success: true,
        paymentMethod: 'pix',
        qrCode: qrCode,
        codigoPix: codigoPix,
        paymentId: data.id
      })
    }

    // 🔥 SE FOR CARTÃO - CHECKOUT PRO (REDIRECT)
    const valorTotal = Number(totalPrice || 109.64)

    const preferenceData = {
      items: [{
        id: `plan-${planId}`,
        title: `Plano ${planName} - PREPARADO`,
        description: `Assinatura ${interval} - Acesso completo`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: valorTotal
      }],
      payer: {
        email: userProfile.email,
        name: userProfile.full_name || 'Cliente',
        phone: userProfile.phone ? { number: userProfile.phone } : undefined,
        address: {
          zip_code: '00000000',
          street_name: 'Rua',
          street_number: '0',
          neighborhood: 'Centro',
          city: userProfile.address?.split('-')[0]?.trim() || 'São Paulo',
          federal_unit: userProfile.address?.split('-')[1]?.trim() || 'SP'
        }
      },
      payment_methods: {
        installments: parcelas || 12,
        default_installments: 1,
        excluded_payment_methods: [],
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ]
      },
      back_urls: {
        success: `${APP_URL}/auth/welcome?payment=success`,
        failure: `${APP_URL}/planos?payment=failure`,
        pending: `${APP_URL}/planos?payment=pending`
      },
      auto_return: 'approved',
      notification_url: `${APP_URL}/api/mercadopago/webhook`,
      external_reference: `plan_${planId}_user_${userId}`,
      metadata: {
        plan_id: planId,
        plan_name: planName,
        user_id: userId,
        interval: interval,
        test: IS_SANDBOX
      }
    }

    console.log('📤 Criando preferência para Checkout Pro...')

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { success: false, error: data.message || 'Erro ao criar preferência' },
        { status: response.status }
      )
    }

    console.log('✅ Preferência criada:', data.id)
    console.log('🔗 init_point:', data.init_point)
    console.log('🔗 sandbox_init_point:', data.sandbox_init_point)

    return NextResponse.json({
      success: true,
      paymentMethod: 'card',
      initPoint: IS_SANDBOX ? data.sandbox_init_point : data.init_point,
      preferenceId: data.id
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
