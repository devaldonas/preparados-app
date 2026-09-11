require('dotenv').config({ path: '.env.local' })

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'

async function criarPlano() {
  console.log('🚀 Criando plano de assinatura no Mercado Pago...')
  console.log('🔑 Token:', MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20) + '...')

  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Assinatura PREPARADO - Acesso Mensal',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        repetitions: 12,
        transaction_amount: 3.69,
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

  console.log('✅ Plano criado com sucesso!')
  console.log('📋 ID do plano:', data.id)
  console.log('🔗 Init Point:', data.init_point)
  console.log('')
  console.log('📝 COPIE O ID DO PLANO E ADICIONE NO .env.local:')
  console.log(`MERCADO_PAGO_PLAN_ID="${data.id}"`)
}

criarPlano()
