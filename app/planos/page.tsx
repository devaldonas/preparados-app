'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Check, CreditCard, Copy } from 'lucide-react'

// 🔥 VALOR DE TESTE - R$ 1,00
const VALOR_TOTAL = 1.00
const VALOR_PARCELA = 1.00

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [codigoPix, setCodigoPix] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [showPix, setShowPix] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [parcelas, setParcelas] = useState(1)
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

  const handleAssinar = async () => {
    setProcessing(true)
    setQrCode(null)
    setCodigoPix(null)
    setPaymentId(null)
    setErrorMessage(null)

    try {
      const payload = {
        planId: 2,
        planName: 'Teste - R$ 1,00',
        price: VALOR_PARCELA,
        totalPrice: VALOR_TOTAL,
        interval: 'year',
        userId: user.id,
        userEmail: user.email,
        paymentMethod: paymentMethod,
        parcelas: parcelas
      }

      console.log('📤 Enviando para API:', payload)

      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      // 🔥 PIX - Mostrar QR Code
      if (data.paymentMethod === 'pix') {
        console.log('✅ PIX gerado com sucesso!')
        setQrCode(data.qrCode)
        setCodigoPix(data.codigoPix)
        setPaymentId(data.paymentId)
        setShowPix(true)
        setProcessing(false)
        
        verificarPagamentoAutomatico(data.paymentId)
        return
      }

      // 🔥 CARTÃO - REDIRECIONAR PARA O MERCADO PAGO
      if (data.initPoint) {
        console.log('🔗 Redirecionando para:', data.initPoint)
        window.location.href = data.initPoint
        return
      } else {
        throw new Error('Não foi possível gerar o link de pagamento')
      }

    } catch (error: any) {
      console.error('❌ Erro ao assinar:', error)
      setErrorMessage(error.message || 'Erro ao processar pagamento. Tente novamente.')
      setProcessing(false)
    }
  }

  // 🔥 FUNÇÃO ESPECÍFICA PARA GERAR PIX
  const handleGerarPix = async () => {
    setPaymentMethod('pix')
    // Aguardar o estado ser atualizado
    setTimeout(() => {
      handleAssinar()
    }, 100)
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

  // 🔥 TELA DO PIX
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
            TESTE - R$ 1,00
          </h1>
          <p className="text-gray-500 mt-2">
            Valor reduzido para teste de pagamento
          </p>
          <div className="mt-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">
            🧪 Modo de Teste
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-[#FFB800] p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Plano de Teste</h3>
              <p className="text-sm text-gray-500 mt-1">R$ 1,00 para testar o pagamento</p>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#FFB800]">
                  R$ 1,00
                </span>
                <span className="text-sm text-gray-400 ml-1">/teste</span>
              </div>

              <ul className="mt-6 space-y-2 text-left">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Teste de pagamento</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Valor mínimo de R$ 1,00</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Teste o fluxo completo</span>
                </li>
              </ul>

              <div className="mt-6 text-xs text-[#FFB800] font-medium">
                🧪 Plano de Teste
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">TESTE</h2>
            <p className="text-3xl font-bold text-[#FFB800] mt-2">
              R$ 1,00
            </p>
            <p className="text-sm text-gray-400">À vista</p>
          </div>

          <div className="border-t border-gray-200 my-6" />

          <div className="space-y-4 mb-6">
            <p className="text-sm font-medium text-gray-700">Escolha a forma de pagamento:</p>
            
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'card' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200'
              }`}
            >
              <CreditCard size={20} className={paymentMethod === 'card' ? 'text-[#FFB800]' : 'text-gray-400'} />
              <div className="text-left">
                <p className="font-medium text-sm">Cartão de Crédito</p>
                <p className="text-xs text-gray-400">R$ 1,00 à vista</p>
              </div>
              {paymentMethod === 'card' && <Check size={18} className="ml-auto text-[#FFB800]" />}
            </button>

            <button
              onClick={handleGerarPix}
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
                <p className="text-xs text-gray-400">R$ 1,00 à vista</p>
              </div>
              <Check size={18} className={`ml-auto ${paymentMethod === 'pix' ? 'text-[#FFB800]' : 'text-transparent'}`} />
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
                Pagar R$ 1,00
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            🔒 Pagamento seguro via Mercado Pago
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
          🧪 Este é um plano de teste com valor de R$ 1,00.
          <br />
          O pagamento será processado normalmente.
        </p>
      </div>
    </div>
  )
}
