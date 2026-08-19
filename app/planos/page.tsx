'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Crown, Check, CreditCard, QrCode, Copy, X } from 'lucide-react'

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

    try {
      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 1,
          planName: 'Plano Anual',
          price: 39.69,
          interval: 'year',
          userId: user.id,
          userEmail: user.email,
          paymentMethod: paymentMethod
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      // 🔥 Se for PIX, mostrar QR Code
      if (data.paymentMethod === 'pix') {
        setQrCode(data.qrCode)
        setCodigoPix(data.codigoPix)
        setPaymentId(data.paymentId)
        setShowPix(true)
        setProcessing(false)
        
        // 🔥 Iniciar verificação automática de pagamento
        verificarPagamentoAutomatico(data.paymentId)
        return
      }

      // 🔥 Se for cartão, redirecionar para Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint
      }

    } catch (error) {
      console.error('Erro ao assinar:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
      setProcessing(false)
    }
  }

  // 🔥 VERIFICAÇÃO AUTOMÁTICA DE PAGAMENTO
  const verificarPagamentoAutomatico = async (paymentId: string) => {
    setCheckingPayment(true)
    
    let tentativas = 0
    const maxTentativas = 24 // 2 minutos (5 segundos * 24)
    
    const intervalo = setInterval(async () => {
      tentativas++
      
      try {
        const response = await fetch(`/api/mercadopago/status?payment_id=${paymentId}`)
        const data = await response.json()
        
        console.log(`🔍 Verificando pagamento (${tentativas}/${maxTentativas}):`, data.status)
        
        if (data.status === 'approved') {
          clearInterval(intervalo)
          setCheckingPayment(false)
          // 🔥 Pagamento confirmado, redirecionar para welcome
          router.push('/auth/welcome')
        } else if (tentativas >= maxTentativas) {
          clearInterval(intervalo)
          setCheckingPayment(false)
          // 🔥 Tempo esgotado, mostrar mensagem
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
    }, 5000) // Verificar a cada 5 segundos
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

  if (showPix && qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Pagar com PIX
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            Valor: {formatPrice(476.28)}
          </p>
          
          {checkingPayment && (
            <div className="text-center mb-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB800]"></div>
              <p className="text-sm text-gray-500 mt-2">Aguardando confirmação do pagamento...</p>
            </div>
          )}
          
          {qrCode && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
              <img 
                src={qrCode} 
                alt="QR Code PIX" 
                className="w-48 h-48"
                onError={(e) => {
                  console.error('❌ Erro ao carregar QR Code:', e)
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
            Após o pagamento, você será redirecionado automaticamente.
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Plano Anual
          </h1>
          <p className="text-gray-600 mt-2">
            Acesso completo a todos os recursos do PREPARADO
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#FFB800] shadow-lg p-8 max-w-lg mx-auto">
          <div className="text-center">
            <div className="inline-block bg-[#FFB800]/10 px-4 py-1 rounded-full mb-4">
              <span className="text-sm font-semibold text-[#FFB800]">⭐ Melhor plano</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Plano Anual</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">12x de</span>
              <span className="text-5xl font-bold text-[#FFB800] ml-2">R$ 39,69</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">ou R$ 476,28 à vista no PIX</p>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

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
                <p className="text-xs text-gray-400">12x de R$ 39,69</p>
              </div>
              {paymentMethod === 'card' && <Check size={18} className="ml-auto text-[#FFB800]" />}
            </button>

            <button
              onClick={() => setPaymentMethod('pix')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                paymentMethod === 'pix' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200'
              }`}
            >
              <QrCode size={20} className={paymentMethod === 'pix' ? 'text-[#FFB800]' : 'text-gray-400'} />
              <div className="text-left">
                <p className="font-medium text-sm">PIX</p>
                <p className="text-xs text-gray-400">R$ 476,28 à vista</p>
              </div>
              {paymentMethod === 'pix' && <Check size={18} className="ml-auto text-[#FFB800]" />}
            </button>
          </div>

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
            ) : (
              <>
                {paymentMethod === 'pix' ? <QrCode size={20} /> : <CreditCard size={20} />}
                {paymentMethod === 'pix' ? 'Gerar PIX' : 'Assinar agora'}
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Pagamento seguro via Mercado Pago
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 Pagamento seguro</span>
            <span>•</span>
            <span>💳 12x sem juros</span>
            <span>•</span>
            <span>📱 PIX disponível</span>
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
