import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    console.log('🔍 Verificando status do pagamento:', paymentId)

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID não informado'
      }, { status: 400 })
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return NextResponse.json({
        success: false,
        error: 'Token do Mercado Pago não configurado'
      }, { status: 500 })
    }

    // 🔥 BUSCAR STATUS DO PAGAMENTO
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar status:', response.status)
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar status: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Status do pagamento:', data.status)

    return NextResponse.json({
      success: true,
      status: data.status,
      payment: data
    })

  } catch (error) {
    console.error('❌ Erro ao buscar status do pagamento:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar status'
    }, { status: 500 })
  }
}