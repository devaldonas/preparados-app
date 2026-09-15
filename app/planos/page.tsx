'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Check, CreditCard, Copy } from 'lucide-react'
import { CardFormWrapper } from '@/components/CardFormWrapper'

const PLANOS = {
  monthly: {
    id: 1,
    name: 'Mensal',
    description: 'Acesso completo por 1 mês',
    totalPrice: 70.00,
    priceLabel: '/mês',
    parcelasLabel: 'Pagamento mensal',
    interval: 'month',
  },
  annual: {
    id: 2,
    name: 'Anual',
    description: 'Acesso completo por 1 ano',
    totalPrice: 504.00,
    priceLabel: '/ano',
    parcelasLabel: 'Pagamento anual',
    interval: 'year',
  },
} as const

type PlanType = keyof typeof PLANOS

export default function PlanosPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual')

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [codigoPix, setCodigoPix] = useState<string | null>(null)
  const [showPix, setShowPix] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const [usuarioTemAcessoGratuito, setUsuarioTemAcessoGratuito] =
    useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] =
    useState<'card' | 'pix'>('card')

  const planoAtual = PLANOS[selectedPlan]

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      console.log('🔍 Carregando dados da página de planos...')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log('👤 Usuário:', user?.id)

      if (!user) {
        console.log('❌ Sem usuário, redirecionando para login')
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('acesso_gratuito_ate, subscription_status')
        .eq('id', user.id)
        .single()

      console.log('📊 Perfil:', profile)
      console.log('📊 Erro:', profileError)
      console.log(
        '📊 acesso_gratuito_ate:',
        profile?.acesso_gratuito_ate
      )
      console.log(
        '📊 subscription_status:',
        profile?.subscription_status
      )

      // VERIFICAÇÃO 1: ACESSO GRATUITO
      if (
        profile?.acesso_gratuito_ate &&
        new Date(profile.acesso_gratuito_ate) > new Date()
      ) {
        console.log(
          '⚠️ Usuário tem acesso gratuito ativo, redirecionando para dashboard'
        )

        setUsuarioTemAcessoGratuito(true)
        router.push('/dashboard')
        return
      }

      // VERIFICAÇÃO 2: ASSINATURA ATIVA
      if (profile?.subscription_status === 'active') {
        console.log(
          '⚠️ Usuário tem assinatura ativa, redirecionando para dashboard'
        )

        router.push('/dashboard')
        return
      }

      console.log(
        '✅ Nenhum redirecionamento necessário, mostrando página de planos'
      )
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePix = async () => {
    if (!user) {
      setErrorMessage('Usuário não encontrado.')
      return
    }

    setProcessing(true)
    setQrCode(null)
    setCodigoPix(null)
    setPaymentId(null)
    setErrorMessage(null)

    try {
      const payload = {
        planId: planoAtual.id,
        planName: planoAtual.name,
        price: planoAtual.totalPrice,
        totalPrice: planoAtual.totalPrice,
        interval: planoAtual.interval,
        userId: user.id,
        userEmail: user.email,
        paymentMethod: 'pix',
        parcelas: 1,
      }

      console.log('🟢 Gerando PIX Mercado Pago:', payload)

      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar PIX')
      }

      if (data.paymentMethod === 'pix') {
        setQrCode(data.qrCode)
        setCodigoPix(data.codigoPix)
        setPaymentId(data.paymentId)
        setShowPix(true)
        setProcessing(false)

        verificarPagamentoAutomatico(data.paymentId)
      } else {
        throw new Error('Erro ao gerar PIX')
      }
    } catch (error: any) {
      console.error('❌ Erro no PIX:', error)

      setErrorMessage(
        error.message || 'Erro ao gerar PIX'
      )

      setProcessing(false)
    }
  }

  const handleCardSuccess = (subscriptionId: string) => {
    console.log(
      '✅ Assinatura Stripe ativada:',
      subscriptionId
    )

    router.push('/auth/welcome')
  }

  const handleCardError = (error: string) => {
    setErrorMessage(error)
  }

  const verificarPagamentoAutomatico = async (
    paymentId: string
  ) => {
    setCheckingPayment(true)

    let tentativas = 0
    const maxTentativas = 24

    const intervalo = setInterval(async () => {
      tentativas++

      try {
        const response = await fetch(
          `/api/mercadopago/status?payment_id=${paymentId}`
        )

        const data = await response.json()

        console.log(
          `🔎 Status PIX tentativa ${tentativas}:`,
          data.status
        )

        if (data.status === 'approved') {
          clearInterval(intervalo)
          setCheckingPayment(false)

          router.push('/auth/welcome')
        } else if (tentativas >= maxTentativas) {
          clearInterval(intervalo)
          setCheckingPayment(false)

          alert('⏳ O pagamento está sendo processado.')

          setShowPix(false)
          router.push('/dashboard')
        }
      } catch (error) {
        console.error(
          '❌ Erro ao verificar pagamento:',
          error
        )

        if (tentativas >= maxTentativas) {
          clearInterval(intervalo)
          setCheckingPayment(false)
        }
      }
    }, 5000)
  }

  const copiarCodigoPix = () => {
    if (codigoPix) {
      navigator.clipboard.writeText(codigoPix)

      alert('✅ Código PIX copiado!')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (usuarioTemAcessoGratuito) {
    return null
  }

  if (showPix && qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Pagar com PIX
          </h2>

          <p className="text-center text-gray-500 text-sm mb-1">
            Plano {planoAtual.name}
          </p>

          <p className="text-center text-gray-500 text-sm mb-6">
            Valor: {formatPrice(planoAtual.totalPrice)}
          </p>

          {checkingPayment && (
            <div className="text-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB800] mx-auto" />

              <p className="text-sm text-gray-500 mt-2">
                Aguardando confirmação...
              </p>
            </div>
          )}

          {qrCode && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-48 h-48"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {codigoPix && (
            <button
              onClick={copiarCodigoPix}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
            >
              <Copy size={18} />
              Copiar código PIX
            </button>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            Após o pagamento, você será redirecionado.
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full mt-4 bg-gray-200 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">

        {/* CABEÇALHO */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Escolha seu plano
          </h1>

          <p className="text-gray-500 mt-2">
            Tenha acesso completo ao PREPARADO
          </p>
        </div>

        {/* PLANOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* PLANO MENSAL */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan('monthly')
              setErrorMessage(null)
            }}
            className={`text-left bg-white rounded-2xl border-2 p-6 shadow-lg transition ${
              selectedPlan === 'monthly'
                ? 'border-[#FFB800]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">

              <h3 className="text-xl font-bold text-gray-900">
                Mensal
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Acesso completo por 1 mês
              </p>

              <div className="mt-5">
                <span className="text-3xl font-bold text-[#FFB800]">
                  {formatPrice(PLANOS.monthly.totalPrice)}
                </span>

                <span className="text-sm text-gray-400 ml-1">
                  /mês
                </span>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Cobrança mensal
              </div>

              {selectedPlan === 'monthly' && (
                <div className="mt-5 text-xs text-[#FFB800] font-medium">
                  ✅ Plano selecionado
                </div>
              )}
            </div>
          </button>

          {/* PLANO ANUAL */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan('annual')
              setErrorMessage(null)
            }}
            className={`text-left bg-white rounded-2xl border-2 p-6 shadow-lg transition relative ${
              selectedPlan === 'annual'
                ? 'border-[#FFB800]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="absolute top-4 right-4 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-full">
              MELHOR VALOR
            </div>

            <div className="text-center">

              <h3 className="text-xl font-bold text-gray-900">
                Anual
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Acesso completo por 1 ano
              </p>

              <div className="mt-5">
                <span className="text-3xl font-bold text-[#FFB800]">
                  {formatPrice(PLANOS.annual.totalPrice)}
                </span>

                <span className="text-sm text-gray-400 ml-1">
                  /ano
                </span>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Equivale a {formatPrice(42)} por mês
              </div>

              {selectedPlan === 'annual' && (
                <div className="mt-5 text-xs text-[#FFB800] font-medium">
                  ✅ Plano selecionado
                </div>
              )}
            </div>
          </button>
        </div>

        {/* BENEFÍCIOS */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 max-w-4xl mx-auto mt-8">

          <h2 className="text-lg font-bold text-gray-900 text-center mb-5">
            O que está incluído
          </h2>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <li className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
              <span>Acesso a todos os checklists</span>
            </li>

            <li className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
              <span>Conexão com grupos</span>
            </li>

            <li className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
              <span>Chat em tempo real</span>
            </li>

            <li className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
              <span>Guia de catástrofes</span>
            </li>

            <li className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
              <span>Mentorias Semanais</span>
            </li>

          </ul>
        </div>

        {/* PAGAMENTO */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg mx-auto mt-8">

          <div className="text-center mb-6">

            <p className="text-sm text-gray-500">
              Plano escolhido
            </p>

            <h2 className="text-xl font-bold text-gray-900">
              {planoAtual.name}
            </h2>

            <p className="text-3xl font-bold text-[#FFB800] mt-2">
              {formatPrice(planoAtual.totalPrice)}
              <span className="text-sm text-gray-400 ml-1">
                {planoAtual.priceLabel}
              </span>
            </p>

          </div>

          <div className="border-t border-gray-200 my-6" />

          {/* FORMA DE PAGAMENTO */}
          <div className="space-y-4 mb-6">

            <p className="text-sm font-medium text-gray-700">
              Escolha a forma de pagamento:
            </p>

            {/* CARTÃO */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('card')
                setErrorMessage(null)
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'card'
                  ? 'border-[#FFB800] bg-[#FFB800]/5'
                  : 'border-gray-200'
              }`}
            >
              <CreditCard
                size={20}
                className={
                  paymentMethod === 'card'
                    ? 'text-[#FFB800]'
                    : 'text-gray-400'
                }
              />

              <div className="text-left">
                <p className="font-medium text-sm">
                  Cartão de Crédito
                </p>

                <p className="text-xs text-gray-400">
                  {selectedPlan === 'monthly'
                    ? 'Cobrança mensal de R$ 70,00'
                    : 'Cobrança anual de R$ 504,00'}
                </p>
              </div>

              {paymentMethod === 'card' && (
                <Check
                  size={18}
                  className="ml-auto text-[#FFB800]"
                />
              )}
            </button>

            {/* PIX */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('pix')
                setErrorMessage(null)
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'pix'
                  ? 'border-[#FFB800] bg-[#FFB800]/5'
                  : 'border-gray-200'
              }`}
            >
              <img
                src="/images/pix-icon-amarelo.svg"
                alt="PIX"
                className="w-5 h-5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />

              <div className="text-left">
                <p className="font-medium text-sm">
                  PIX
                </p>

                <p className="text-xs text-gray-400">
                  {formatPrice(planoAtual.totalPrice)} à vista
                </p>
              </div>

              {paymentMethod === 'pix' && (
                <Check
                  size={18}
                  className="ml-auto text-[#FFB800]"
                />
              )}
            </button>
          </div>
        {/* ERRO */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {errorMessage}
              </p>
            </div>
          )}

          {/* STRIPE - CARTÃO */}
          {paymentMethod === 'card' && user && (
            <CardFormWrapper
              userId={user.id}
              userEmail={user.email}
              plan={selectedPlan}
              onSuccess={handleCardSuccess}
              onError={handleCardError}
            />
          )}

          {/* MERCADO PAGO - PIX */}
          {paymentMethod === 'pix' && (
            <button
              type="button"
              onClick={handlePix}
              disabled={processing}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {processing ? (
                <>
                  <Loader2
                    size={24}
                    className="animate-spin"
                  />
                  Processando...
                </>
              ) : (
                <>
                  <img
                    src="/images/pix-icon-amarelo.svg"
                    alt="PIX"
                    className="w-5 h-5"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  Gerar PIX
                </>
              )}
            </button>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            🔒 Pagamento seguro
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">

            <span>
              🔒 Pagamento seguro
            </span>

            <span>•</span>

            <span className="flex items-center gap-1">
              <img
                src="/images/pix-icon-amarelo.svg"
                alt="PIX"
                className="w-4 h-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              PIX disponível
            </span>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao assinar, você concorda com nossos termos de uso.
          Cancele a qualquer momento.
        </p>

      </div>
    </div>
  )
}