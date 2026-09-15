'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

interface CheckoutMPProps {
  userId: string
  userEmail: string
  plan: 'monthly' | 'annual'
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMP({
  userId,
  userEmail,
  plan,
  onSuccess,
  onError,
}: CheckoutMPProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setProcessing(true)
    setError(null)

    try {
      console.log('💳 Iniciando checkout Stripe:', {
        plan,
        userId,
        userEmail,
      })

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId,
          userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Erro ao criar checkout no Stripe'
        )
      }

      if (!data.url) {
        throw new Error('O Stripe não retornou a URL do checkout')
      }

      console.log('✅ Checkout Stripe criado:', data.sessionId)

      window.location.href = data.url
    } catch (err: unknown) {
      console.error('❌ Erro no checkout Stripe:', err)

      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao processar pagamento'

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
            Redirecionando para pagamento...
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
        🔒 Pagamento seguro processado pelo Stripe
      </p>
    </div>
  )
}
