// app/api/bdm/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BDM_API_KEY = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
const BDM_PARTNER_EMAIL = 'ufoparticipacoes@dakila.com.br'
const BDM_API_URL = 'https://partner.douradocash.com.br/ecommerce-partner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, attachment } = body

    console.log('📦 Gerando pagamento BDM:', { amount, orderId })

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido', success: false },
        { status: 400 }
      )
    }

    // Enviar o valor em BDM (já convertido pelo frontend)
    const response = await fetch(`${BDM_API_URL}/billing-code`, {
      method: 'POST',
      headers: {
        'x-api-key': BDM_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        partnerEmail: BDM_PARTNER_EMAIL,
        amount: amount, // ← JÁ É O VALOR EM BDM
        toAsset: 'BDM',
        fromAsset: 'BDM', // ← CONVERTENDO DE BDM PARA BDM
        attachment: attachment || `#ORDER-${orderId}`
      })
    })

    const data = await response.json()

    console.log('📥 Resposta BDM:', { 
      status: response.status, 
      ok: response.ok,
      data 
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.message || `Erro ${response.status}`,
          details: data,
          success: false 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      billingCode: data.billingCode,
      transactionId: data.id,
      qrCode: data.qrCode
    })

  } catch (error) {
    console.error('❌ Erro ao gerar pagamento BDM:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao gerar pagamento',
        success: false 
      },
      { status: 500 }
    )
  }
}