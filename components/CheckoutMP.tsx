'use client'

import { useState, useEffect, useRef } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    MercadoPago: any
  }
}

interface CheckoutMPProps {
  userId: string
  userEmail: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMP({ userId, userEmail, onSuccess, onError }: CheckoutMPProps) {
  const [processing, setProcessing] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mp, setMp] = useState<any>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const initialized = useRef(false)

  // 🔥 Inicializar SDK após o script carregar
  useEffect(() => {
    if (!scriptLoaded || initialized.current) return
    initialized.current = true

    let mounted = true

    const initSDK = () => {
      try {
        console.log('✅ Script do Mercado Pago carregado. Inicializando...')

        const mpInstance = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
            'APP_USR-4f85174a-8f85-4141-901b-2613dbd0ae7e',
          { locale: 'pt-BR' }
        )

        console.log('📦 Montando campos seguros...')

        mpInstance.fields.create('cardNumber', {
          placeholder: '0000 0000 0000 0000',
        }).mount('cardNumber')

        mpInstance.fields.create('expirationDate', {
          placeholder: 'MM/AA',
        }).mount('expirationDate')

        mpInstance.fields.create('securityCode', {
          placeholder: '123',
        }).mount('securityCode')

        console.log('✅ Campos seguros montados!')

        if (mounted) {
          setMp(mpInstance)
          setSdkReady(true)
        }
      } catch (err) {
        console.error('❌ Erro ao inicializar SDK:', err)
        if (mounted) setError('Erro ao carregar formulário de pagamento')
      }
    }

    initSDK()

    return () => {
      mounted = false
    }
  }, [scriptLoaded])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substr(0, 14)
  }

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
      if (!mp || !sdkReady) {
        throw new Error('SDK não está pronta. Aguarde um momento.')
      }

      console.log('📝 Gerando token do cartão...')

      const token = await mp.fields.createCardToken({
        cardholderName: cardholderName,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      })

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
          cardTokenId: token.id,
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
    } finally {
      setProcessing(false)
    }
  }

  if (!sdkReady) {
    return (
      <>
        {/* 🔥 Carregar SDK JS v2 do Mercado Pago via next/script */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('✅ Script do Mercado Pago carregado')
            setScriptLoaded(true)
          }}
          onError={() => {
            console.error('❌ Erro ao carregar script do Mercado Pago')
            setError('Erro ao carregar formulário de pagamento')
          }}
        />
        <div className="p-8 text-center">
          <Loader2 className="animate-spin mx-auto text-[#FFB800]" size={32} />
          <p className="text-sm text-gray-500 mt-2">Carregando formulário do Mercado Pago...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Número do cartão</label>
          <div
            id="cardNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          ></div>
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
            <div
              id="expirationDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            ></div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">CVV</label>
            <div
              id="securityCode"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            ></div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">CPF do titular</label>
          <input
            type="text"
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
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
    </>
  )
}
