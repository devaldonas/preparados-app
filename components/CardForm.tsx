'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { initMercadoPago, CardNumber, ExpirationDate, SecurityCode, createCardToken } from '@mercadopago/sdk-react'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-4f85174a-8f85-4141-901b-2613dbd0ae7e'
initMercadoPago(PUBLIC_KEY)

interface CardFormProps {
  userId: string
  userEmail: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CardForm({ userId, userEmail, onSuccess, onError }: CardFormProps) {
  const [processing, setProcessing] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError(null)

    try {
      if (!cardholderName || cardholderName.length < 3) {
        throw new Error('Nome no cartão inválido')
      }
      if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
        throw new Error('CPF inválido')
      }

      console.log('📝 Gerando token do cartão (Secure Fields)...')

      const token = await createCardToken({
        cardholderName: cardholderName,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      })

      // 🔥 VERIFICAR SE O TOKEN FOI GERADO
      if (!token || !token.id) {
        throw new Error('Erro ao gerar token do cartão. Verifique os dados.')
      }

      console.log('✅ Token gerado:', token.id)

      const response = await fetch('/api/mercadopago/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          cardTokenId: token.id
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      console.log('✅ Assinatura criada:', data.subscriptionId)
      onSuccess(data.subscriptionId)

    } catch (error: any) {
      console.error('❌ Erro:', error)
      setError(error.message || 'Erro ao processar cartão')
      onError(error.message || 'Erro ao processar cartão')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Número do cartão</label>
        <CardNumber placeholder="0000 0000 0000 0000" />
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Nome no cartão</label>
        <input
          type="text"
          placeholder="NOME COMO NO CARTÃO"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFB800] focus:border-transparent uppercase"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Validade</label>
          <ExpirationDate placeholder="MM/AA" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">CVV</label>
          <SecurityCode placeholder="123" />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">CPF do titular</label>
        <input
          type="text"
          placeholder="000.000.000-00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          maxLength={14}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
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
    </form>
  )
}
