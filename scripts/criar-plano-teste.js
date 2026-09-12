require('dotenv').config({ path: '.env.local' })

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

async function criarPlano() {
  console.log('🚀 Criando plano de assinatura de TESTE no Mercado Pago...')

  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Assinatura PREPARADO - TESTE R$1,00/mês',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        repetitions: 12,
        transaction_amount: 1.00,
        currency_id: 'BRL'
      },
      payment_methods_allowed: {
        payment_types: [
          { id: 'credit_card' }
        ]
      },
      back_url: `${APP_URL}/auth/welcome`
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('❌ Erro ao criar plano:', data)
    return
  }

  console.log('✅ Plano de TESTE criado com sucesso!')
  console.log('📋 ID do plano:', data.id)
  console.log('')
  console.log('📝 ATUALIZE O .env.local E A VERCEL COM:')
  console.log(`MERCADO_PAGO_PLAN_ID="${data.id}"`)
}

criarPlano()
