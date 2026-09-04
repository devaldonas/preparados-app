'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Check, CreditCard, Copy } from 'lucide-react'

// 🔥 VALOR DA ASSINATURA
const VALOR_TOTAL = 476.28
const VALOR_PARCELA = 39.69

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [codigoPix, setCodigoPix] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix'>('stripe')
  const [showPix, setShowPix] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [usuarioTemAcessoGratuito, setUsuarioTemAcessoGratuito] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('acesso_gratuito_ate, subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.acesso_gratuito_ate && new Date(profile.acesso_gratuito_ate) > new Date()) {
        setUsuarioTemAcessoGratuito(true)
        router.push('/dashboard')
        return
      }

      if (profile?.subscription_status === 'active') {
        router.push('/dashboard')
        return
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 FUNÇÃO PARA ASSINAR (Stripe)
  const handleAssinarStripe = async () => {
    setProcessing(true)
    setErrorMessage(null)

    try {
      console.log('📤 Criando checkout no Stripe...')

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 2,
          planName: 'Anual',
          userId: user.id,
          userEmail: user.email,
          amount: VALOR_TOTAL,
          interval: 'year',
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar checkout')
      }

      console.log('🔗 Redirecionando para:', data.url)
      window.location.href = data.url

    } catch (error: any) {
      console.error('❌ Erro no Stripe:', error)
      setErrorMessage(error.message || 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  // 🔥 FUNÇÃO PARA PIX (Mercado Pago) - CORRIGIDA
  const handleAssinarPix = async () => {
    setProcessing(true)
    setQrCode(null)
    setCodigoPix(null)
    setPaymentId(null)
    setErrorMessage(null)

    try {
      const payload = {
        planId: 2,
        planName: 'Anual',
        price: VALOR_PARCELA,
        totalPrice: VALOR_TOTAL,
        interval: 'year',
        userId: user.id,
        userEmail: user.email,
        paymentMethod: 'pix',
        parcelas: 1
      }

      console.log('📤 Gerando PIX no Mercado Pago...', payload)

      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      console.log('📥 Resposta do PIX:', data)

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar PIX')
      }

      setQrCode(data.qrCode)
      setCodigoPix(data.codigoPix)
      setPaymentId(data.paymentId)
      setShowPix(true)
      setProcessing(false)
      
      verificarPagamentoAutomatico(data.paymentId)

    } catch (error: any) {
      console.error('❌ Erro no PIX:', error)
      setErrorMessage(error.message || 'Erro ao gerar PIX')
      setProcessing(false)
    }
  }

  // 🔥 FUNÇÃO PRINCIPAL - CORRIGIDA
  const handleAssinar = async () => {
    if (paymentMethod === 'stripe') {
      await handleAssinarStripe()
    } else if (paymentMethod === 'pix') {
      await handleAssinarPix()
    } else {
      setErrorMessage('Método de pagamento não selecionado')
    }
  }

  const verificarPagamentoAutomatico = async (paymentId: string) => {
    setCheckingPayment(true)
    
    let tentativas = 0
    const maxTentativas = 24
    
    const intervalo = setInterval(async () => {
      tentativas++
      
      try {
        const response = await fetch(`/api/mercadopago/status?payment_id=${paymentId}`)
        const data = await response.json()
        
        console.log(`🔍 Verificando pagamento (${tentativas}/${maxTentativas}):`, data.status)
        
        if (data.status === 'approved') {
          clearInterval(intervalo)
          setCheckingPayment(false)
          router.push('/auth/welcome')
        } else if (tentativas >= maxTentativas) {
          clearInterval(intervalo)
          setCheckingPayment(false)
          alert('⏳ O pagamento está sendo processado. Você será notificado quando for confirmado.')
          setShowPix(false)
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
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
      currency: 'BRL'
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
          <p className="text-center text-gray-500 text-sm mb-6">
            Valor: {formatPrice(VALOR_TOTAL)}
          </p>
          
          {checkingPayment && (
            <div className="text-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB800]" />
              <p className="text-sm text-gray-500 mt-2">Aguardando confirmação...</p>
            </div>
          )}
          
          {qrCode && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
              <img 
                src={qrCode} 
                alt="QR Code PIX" 
                className="w-48 h-48"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Plano Anual
          </h1>
          <p className="text-gray-500 mt-2">
            Acesso completo por 1 ano
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-[#FFB800] p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Anual</h3>
              <p className="text-sm text-gray-500 mt-1">Acesso completo por 1 ano</p>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#FFB800]">
                  {formatPrice(VALOR_TOTAL)}
                </span>
                <span className="text-sm text-gray-400 ml-1">/ano</span>
              </div>

              <ul className="mt-6 space-y-2 text-left">
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
                  <span>Dicas diárias</span>
                </li>
              </ul>

              <div className="mt-6 text-xs text-[#FFB800] font-medium">
                ✅ Plano selecionado
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Anual</h2>
            <p className="text-3xl font-bold text-[#FFB800] mt-2">
              {formatPrice(VALOR_TOTAL)}
            </p>
          </div>

          <div className="border-t border-gray-200 my-6" />

          <div className="space-y-4 mb-6">
            <p className="text-sm font-medium text-gray-700">Escolha a forma de pagamento:</p>
            
            {/* 🔥 STRIPE - CARTÃO E BOLETO */}
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'stripe' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200'
              }`}
            >
              <CreditCard size={20} className={paymentMethod === 'stripe' ? 'text-[#FFB800]' : 'text-gray-400'} />
              <div className="text-left">
                <p className="font-medium text-sm">Cartão de Crédito / Boleto</p>
                <p className="text-xs text-gray-400">Parcelamento disponível / Vencimento em 3 dias</p>
              </div>
              {paymentMethod === 'stripe' && <Check size={18} className="ml-auto text-[#FFB800]" />}
            </button>

            {/* 🔥 PIX */}
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'pix' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200'
              }`}
            >
              <img 
                src="/images/pix-icon-amarelo.svg" 
                alt="PIX" 
                className="w-5 h-5"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className="text-left">
                <p className="font-medium text-sm">PIX</p>
                <p className="text-xs text-gray-400">Pagamento à vista</p>
              </div>
              {paymentMethod === 'pix' && <Check size={18} className="ml-auto text-[#FFB800]" />}
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleAssinar}
            disabled={processing}
            className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {processing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Processando...
              </>
            ) : paymentMethod === 'pix' ? (
              <>
                <img src="/images/pix-icon-amarelo.svg" alt="PIX" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                Gerar PIX
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Assinar Agora
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            🔒 Pagamento seguro
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 Pagamento seguro</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <img src="/images/pix-icon-amarelo.svg" alt="PIX" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
