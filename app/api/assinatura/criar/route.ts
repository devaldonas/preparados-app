import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🔥 USAR TOKEN DE PRODUÇÃO
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const IS_SANDBOX = false // 🔥 PRODUÇÃO

console.log(`🚀 Usando token de PRODUÇÃO`)

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

    // 🔥 Buscar dados COMPLETOS do usuário
    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .select('full_name, email, cnpj, phone, street, number, complement, neighborhood, city, state, cep')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('⚠️ Erro ao buscar perfil:', profileError.message)
    }

    // 🔥 Dados COMPLETOS do cliente
    const userProfile = {
      full_name: profile?.full_name || 'Cliente Teste',
      email: userEmail || profile?.email || 'cliente@email.com',
      // 🔥 CPF REAL (substitua pelo CPF do seu cartão)
      document: '12345678909',
      phone: profile?.phone || '11999999999',
      cep: profile?.cep || '01001000',
      street: profile?.street || 'Praça da Sé',
      number: profile?.number || '100',
      neighborhood: profile?.neighborhood || 'Sé',
      city: profile?.city || 'São Paulo',
      state: profile?.state || 'SP'
    }

    console.log('👤 Perfil:', { ...userProfile, document: '***' })

    // 🔥 VALOR DE TESTE - R$ 10,00
    const valorTotal = Number(totalPrice || 10.00)
    const valorParcela = Number(price || 10.00)

    // 🔥 SE FOR PIX
    if (paymentMethod === 'pix') {
      // ... código PIX existente
    }

    // 🔥 SE FOR CARTÃO - CHECKOUT PRO
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
        phone: {
          number: userProfile.phone
        },
        address: {
          zip_code: userProfile.cep,
          street_name: userProfile.street,
          street_number: userProfile.number,
          neighborhood: userProfile.neighborhood,
          city: userProfile.city,
          federal_unit: userProfile.state
        },
        identification: {
          type: 'CPF',
          number: userProfile.document
        }
      },
      payment_methods: {
        installments: parcelas || 12,
        default_installments: 1
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
        interval: interval
      }
    }

    console.log('📤 Criando preferência...')

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

    return NextResponse.json({
      success: true,
      paymentMethod: 'card',
      initPoint: data.init_point,
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
