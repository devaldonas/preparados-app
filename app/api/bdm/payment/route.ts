import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, amountBRL, orderId, attachment } = await request.json()

    // Configurações do BDM
    const apiKey = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
    const partnerEmail = 'ufoparticipacoes@dakila.com.br'

    console.log('💰 Gerando pagamento BDM:')
    console.log('  - Valor em BDM (enviado):', amount)
    console.log('  - Valor em BRL (referência):', amountBRL)
    console.log('  - Order ID:', orderId)

    const url = 'https://partner.douradocash.com.br/ecommerce-partner/billing-code'

    console.log('📡 Chamando BDM:', url)

    // 🔥 CORPO CORRETO - amount em BDM
    const requestBody = {
      partnerEmail: partnerEmail,
      amount: parseFloat(amount), // 🔥 1.23 (em BDM)
      toAsset: 'BRL',             // Queremos receber em BRL
      fromAsset: 'BDM',           // Estamos enviando BDM
      attachment: attachment || `#ORDER-${orderId}`
    }

    console.log('📦 Body enviado para API:')
    console.log('  - amount (em BDM):', requestBody.amount)
    console.log('  - fromAsset:', requestBody.fromAsset)
    console.log('  - toAsset:', requestBody.toAsset)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Resposta não é JSON:', text.substring(0, 200))
      throw new Error('API BDM retornou resposta inválida')
    }

    const data = await response.json()
    console.log('📦 Resposta BDM:', data)

    if (!response.ok) {
      console.error('❌ Erro BDM - Status:', response.status)
      console.error('❌ Erro BDM - Dados:', data)
      throw new Error(data.message || data.error || 'Erro ao gerar pagamento BDM')
    }

    let qrCodeUrl = data.qrCode || data.qr_code
    
    if (qrCodeUrl && qrCodeUrl.startsWith('data:image')) {
      qrCodeUrl = qrCodeUrl
    } else if (qrCodeUrl && !qrCodeUrl.startsWith('http')) {
      qrCodeUrl = `data:image/jpeg;base64,${qrCodeUrl}`
    }

    console.log('✅ Pagamento BDM gerado com sucesso!')
    console.log('  - Valor pago:', amount, 'BDM')
    console.log('  - Equivalente:', amountBRL, 'BRL')
    console.log('  - Billing Code:', data.billingCode || data.billing_code)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeUrl,
      billingCode: data.billingCode || data.billing_code || data.id,
      amountBDM: amount,
      amountBRL: amountBRL,
      transactionId: data.id || data.transaction_id,
      status: data.status || 'pending'
    })

  } catch (error) {
    console.error('❌ Erro no pagamento BDM:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar pagamento BDM'
    }, { status: 500 })
  }
}