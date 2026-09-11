'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'

// 🔥 Inicializar Mercado Pago (executar apenas uma vez)
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-4f85174a-8f85-4141-901b-2613dbd0ae7e'
initMercadoPago(PUBLIC_KEY)

interface CheckoutMPProps {
  userId: string
  userEmail: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMP({ userId, userEmail, onSuccess, onError }: CheckoutMPProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    setProcessing(true)
    setError(null)

    try {
      console.log('📝 Dados do CardPayment Brick:', formData)

      // 🔥 O formData já contém o token do cartão gerado pelo Brick
      const response = await fetch('/api/mercadopago/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          cardTokenId: formData.token,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      console.log('✅ Assinatura criada:', data.subscriptionId)
      onSuccess(data.subscriptionId)
    } catch (err: any) {
      console.error('❌ Erro:', err)
      const msg = err.message || 'Erro ao processar cartão'
      setError(msg)
      onError(msg)
      throw err // O Brick precisa que o erro seja propagado para exibir o estado de erro
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <CardPayment
        initialization={{ amount: 44.28 }}
        onSubmit={handleSubmit}
        onError={(err) => {
          console.error('❌ Erro no Brick:', err)
          setError(err.message || 'Erro ao processar pagamento')
          onError(err.message || 'Erro ao processar pagamento')
        }}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {processing && (
        <div className="text-center py-2">
          <Loader2 className="animate-spin mx-auto text-[#FFB800]" size={24} />
          <p className="text-sm text-gray-500 mt-1">Processando assinatura...</p>
        </div>
      )}
    </div>
  )
}
