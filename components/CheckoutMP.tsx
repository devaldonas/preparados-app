'use client'

import { useState, useEffect, useRef } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const cardFormRef = useRef<any>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let mounted = true

    const initSDK = () => {
      // 🔥 Carregar o script da SDK JS v2
      if (window.MercadoPago) {
        console.log('✅ SDK já estava carregada')
        createCardForm()
        return
      }

      console.log('📦 Carregando SDK JS v2 do Mercado Pago...')
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => {
        console.log('✅ SDK JS v2 carregada')
        if (mounted) createCardForm()
      }
      script.onerror = () => {
        console.error('❌ Erro ao carregar SDK JS v2')
        if (mounted) setError('Erro ao carregar formulário de pagamento')
      }
      document.body.appendChild(script)
    }

    const createCardForm = () => {
      try {
        const mp = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
            'APP_USR-4f85174a-8f85-4141-901b-2613dbd0ae7e',
          { locale: 'pt-BR' }
        )

        console.log('📦 Criando CardForm...')

        const cardForm = mp.cardForm({
          amount: '44.28',
          iframe: true,
          form: {
            id: 'form-checkout',
            cardNumber: {
              id: 'form-checkout__cardNumber',
              placeholder: 'Número do cartão',
            },
            expirationDate: {
              id: 'form-checkout__expirationDate',
              placeholder: 'MM/AA',
            },
            securityCode: {
              id: 'form-checkout__securityCode',
              placeholder: 'Código de segurança',
            },
            cardholderName: {
              id: 'form-checkout__cardholderName',
              placeholder: 'Titular do cartão',
            },
            issuer: {
              id: 'form-checkout__issuer',
              placeholder: 'Banco emissor',
            },
            installments: {
              id: 'form-checkout__installments',
              placeholder: 'Parcelas',
            },
            identificationType: {
              id: 'form-checkout__identificationType',
              placeholder: 'Tipo de documento',
            },
            identificationNumber: {
              id: 'form-checkout__identificationNumber',
              placeholder: 'Número do documento',
            },
            cardholderEmail: {
              id: 'form-checkout__cardholderEmail',
              placeholder: 'E-mail',
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.error('❌ Erro ao montar formulário:', error)
                return
              }
              console.log('✅ Formulário montado com sucesso')
              setSdkReady(true)
            },
            onSubmit: async (event: any) => {
              event.preventDefault()

              const {
                paymentMethodId: payment_method_id,
                issuerId: issuer_id,
                cardholderEmail: email,
                amount,
                token,
                installments,
                identificationNumber,
                identificationType,
              } = cardForm.getCardFormData()

              console.log('📝 Token obtido:', token)

              if (!token) {
                setError('Erro ao gerar token do cartão')
                return
              }

              setProcessing(true)

              try {
                const response = await fetch('/api/mercadopago/assinatura', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    userEmail: email || userEmail,
                    cardTokenId: token,
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
            },
            onFetching: (resource: any) => {
              console.log('Buscando recurso:', resource)
              return () => {}
            },
          },
        })

        cardFormRef.current = cardForm
      } catch (err) {
        console.error('❌ Erro ao criar CardForm:', err)
        setError('Erro ao criar formulário de pagamento')
      }
    }

    initSDK()

    return () => {
      mounted = false
    }
  }, [userId, userEmail, onSuccess, onError])

  if (!sdkReady) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-[#FFB800]" size={32} />
        <p className="text-sm text-gray-500 mt-2">Carregando formulário do Mercado Pago...</p>
      </div>
    )
  }

  return (
    <form id="form-checkout" className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Número do cartão</label>
        <div id="form-checkout__cardNumber" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Nome no cartão</label>
        <div id="form-checkout__cardholderName" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Validade</label>
          <div id="form-checkout__expirationDate" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">CVV</label>
          <div id="form-checkout__securityCode" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></div>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Tipo de documento</label>
        <select id="form-checkout__identificationType" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></select>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Número do documento</label>
        <input
          type="text"
          id="form-checkout__identificationNumber"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="000.000.000-00"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">E-mail</label>
        <input
          type="email"
          id="form-checkout__cardholderEmail"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          defaultValue={userEmail}
        />
      </div>

      <input type="hidden" id="form-checkout__issuer" />
      <input type="hidden" id="form-checkout__installments" value="1" />

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
