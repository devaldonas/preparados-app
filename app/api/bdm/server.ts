// lib/bdm/server.ts (criar este arquivo)
'use server'

const BDM_API_KEY = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
const BDM_PARTNER_EMAIL = 'ed@conexaobdm.com.br'
const BDM_API_URL = 'https://partner.douradocash.com.br/ecommerce-partner'

export async function gerarPagamentoBDM(amount: number, orderId: string) {
  try {
    console.log('🚀 Server Action: Gerando BDM para:', { amount, orderId })

    const response = await fetch(`${BDM_API_URL}/billing-code`, {
      method: 'POST',
      headers: {
        'x-api-key': BDM_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        partnerEmail: BDM_PARTNER_EMAIL,
        amount: amount,
        toAsset: 'BDM',
        fromAsset: 'BRL',
        attachment: `#ORDER-${orderId}`
      })
    })

    const data = await response.json()

    console.log('📥 Resposta:', { status: response.status, data })

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`)
    }

    return {
      success: true,
      billingCode: data.billingCode,
      qrCode: data.qrCode,
      id: data.id
    }

  } catch (error) {
    console.error('❌ Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}