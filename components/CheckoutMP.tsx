'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

interface CheckoutMPProps {
  userId: string
  userEmail: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMP({ userId, userEmail, onSuccess, onError }: CheckoutMPProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 2,
          planName: 'Anual',
          userId,
          userEmail,
          amount: 12.00, // 🔥 VALOR DE TESTE: R$ 12,00/mês
          interval: 'month',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar checkout')
      }

      window.location.href = data.url
    } catch (err: any) {
      console.error('❌ Erro:', err)
      const msg = err.message || 'Erro ao processar pagamento'
      setError(msg)
      onError(msg)
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCheckout}
        disabled={processing}
        className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Assinar com Cartão
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        🔒 Pagamento seguro via Stripe
      </p>
    </div>
  )
}
