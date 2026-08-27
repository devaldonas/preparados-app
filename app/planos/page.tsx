'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Crown, Check, CreditCard, QrCode, Copy, X, Zap } from 'lucide-react'

interface Plano {
  id: number
  name: string
  description: string
  price: string
  interval: string
  interval_count: number
  features: string[]
  is_active: boolean
}

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [codigoPix, setCodigoPix] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [showPix, setShowPix] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [parcelas, setParcelas] = useState(12)
  const [usuarioTemAcessoGratuito, setUsuarioTemAcessoGratuito] = useState(false)

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

      // Verificar se usuário já tem acesso gratuito
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

      const { data: planosData, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      
      setPlanos(planosData || [])
      if (planosData && planosData.length > 0) {
        const anual = planosData.find((p: Plano) => p.interval === 'year')
        setPlanoSelecionado(anual || planosData[0])
        if (anual) {
          setParcelas(12)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async () => {
    if (!planoSelecionado) return
    
    setProcessing(true)
    setQrCode(null)
    setCodigoPix(null)
    setPaymentId(null)

    try {
      const preco = parseFloat(planoSelecionado.price)
      
      let valorTotal = preco
      let valorParcela = preco
      let parcelasDisponiveis = 1
      
      if (paymentMethod === 'card') {
        if (planoSelecionado.interval === 'year') {
          parcelasDisponiveis = Math.min(parcelas, 12)
          const jurosPorParcela: Record<number, number> = {
            1: 0, 2: 0, 3: 0, 4: 2.5, 5: 3.0, 6: 3.5, 7: 4.0, 8: 4.5, 9: 5.0, 10: 5.5, 11: 6.0, 12: 6.5
          }
          const juros = jurosPorParcela[parcelasDisponiveis] || 0
          const totalComJuros = preco * (1 + juros / 100)
          valorParcela = totalComJuros / parcelasDisponiveis
          valorTotal = totalComJuros
        } else {
          parcelasDisponiveis = Math.min(parcelas, 3)
          valorParcela = preco / parcelasDisponiveis
          valorTotal = preco
        }
      }

      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planoSelecionado.id,
          planName: planoSelecionado.name,
          price: valorParcela,
          totalPrice: valorTotal,
          interval: planoSelecionado.interval,
          userId: user.id,
          userEmail: user.email,
          paymentMethod: paymentMethod,
          parcelas: parcelasDisponiveis
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      if (data.paymentMethod === 'pix') {
        setQrCode(data.qrCode)
        setCodigoPix(data.codigoPix)
        setPaymentId(data.paymentId)
        setShowPix(true)
        setProcessing(false)
        
        verificarPagamentoAutomatico(data.paymentId)
        return
      }

      if (data.initPoint) {
        window.location.href = data.initPoint
      }

    } catch (error) {
      console.error('Erro ao assinar:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
      setProcessing(false)
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

  const formatPrice = (price: string | number) => {
    const valor = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
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
            Valor: {planoSelecionado ? formatPrice(planoSelecionado.price) : ''}
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Escolha seu Plano
          </h1>
          <p className="text-gray-500 mt-2">
            Selecione o plano que melhor atende suas necessidades
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {planos.map((plano: Plano) => {
            const isSelected = planoSelecionado?.id === plano.id
            const isPopular = plano.interval === 'year'
            const precoExibido = plano.interval === 'year' ? '12x de R$ 39,69' : formatPrice(plano.price)
            
            return (
              <div
                key={plano.id}
                onClick={() => {
                  setPlanoSelecionado(plano)
                  if (plano.interval === 'year') {
                    setParcelas(12)
                  }
                }}
                className={`bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'border-[#FFB800] shadow-lg' : 'border-gray-200 hover:border-[#FFB800]/50'
                } ${isPopular ? 'relative' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FFB800] text-black text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900">{plano.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plano.description}</p>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold text-[#FFB800]">
                    {plano.interval === 'year' ? '12x de R$ 39,69' : formatPrice(plano.price)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    /{plano.interval === 'month' ? 'mês' : 'ano'}
                  </span>
                  {plano.interval === 'year' && (
                    <p className="text-xs text-gray-400 mt-1">Total: R$ 476,28</p>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  {plano.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-4 text-xs text-[#FFB800] font-medium">
                    ✅ Plano selecionado
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Forma de pagamento */}
        {planoSelecionado && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {planoSelecionado.name}
              </h2>
              <p className="text-3xl font-bold text-[#FFB800] mt-2">
                {planoSelecionado.interval === 'year' ? '12x de R$ 39,69' : formatPrice(planoSelecionado.price)}
              </p>
              {planoSelecionado.interval === 'year' && (
                <p className="text-sm text-gray-400">Total: R$ 476,28</p>
              )}
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
                  <p className="text-xs text-gray-400">
                    {planoSelecionado.interval === 'year' ? 'Em até 12x' : 'Em até 3x'}
                  </p>
                </div>
                {paymentMethod === 'card' && <Check size={18} className="ml-auto text-[#FFB800]" />}
              </button>

              {paymentMethod === 'card' && (
                <div className="pl-12 pr-4 pb-2">
                  <label className="text-xs text-gray-500 block mb-1">Parcelas:</label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  >
                    {planoSelecionado.interval === 'year' ? (
                      <>
                        <option value="1">1x sem juros</option>
                        <option value="2">2x sem juros</option>
                        <option value="3">3x sem juros</option>
                        <option value="4">4x com juros</option>
                        <option value="5">5x com juros</option>
                        <option value="6">6x com juros</option>
                        <option value="7">7x com juros</option>
                        <option value="8">8x com juros</option>
                        <option value="9">9x com juros</option>
                        <option value="10">10x com juros</option>
                        <option value="11">11x com juros</option>
                        <option value="12">12x com juros</option>
                      </>
                    ) : (
                      <>
                        <option value="1">1x sem juros</option>
                        <option value="2">2x sem juros</option>
                        <option value="3">3x sem juros</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <button
                onClick={() => setPaymentMethod('pix')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                  paymentMethod === 'pix' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200'
                }`}
              >
                <img 
                  src={paymentMethod === 'pix' ? '/images/pix-icon-amarelo.svg' : '/images/pix-icon-cinza.svg'} 
                  alt="PIX" 
                  className="w-5 h-5"
                />
                <div className="text-left">
                  <p className="font-medium text-sm">PIX</p>
                  <p className="text-xs text-gray-400">{formatPrice(planoSelecionado.price)} à vista</p>
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
                  {paymentMethod === 'pix' ? (
                    <img src="/images/pix-icon-amarelo.svg" alt="PIX" className="w-5 h-5" />
                  ) : (
                    <CreditCard size={20} />
                  )}
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
              <span className="flex items-center gap-1">
                <img src="/images/pix-icon-amarelo.svg" alt="PIX" className="w-4 h-4" />
                PIX disponível
              </span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao assinar, você concorda com nossos termos de uso.
          Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}
