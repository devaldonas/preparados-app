'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, QrCode, Wallet, Truck, Loader2, Check } from 'lucide-react'
import { useCart } from '@/lib/store/cart'

interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price: number
  product: {
    id: number
    name: string
    price: number
    image_url: string
    is_digital: boolean
    partner_id: string
    free_shipping: boolean
    weight?: number
  }
}

interface Order {
  id: number
  user_id: string
  total_amount: number
  subtotal: number
  shipping_cost: number
  discount_amount: number
  payment_method: string
  payment_status: string
  status: string
  transaction_id: string
  shipping_address: any
  created_at: string
  customer_name: string
  email: string
  items: OrderItem[]
}

interface OpcaoFrete {
  id: number
  servico: string
  transportadora: string
  preco: number
  prazo: number
  gratis: boolean
}

interface FreteInfo {
  valor: number
  prazo: string
  detalhes: any[]
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('order')
  const { clearCart } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<OpcaoFrete | null>(null)
  const [cepDigitado, setCepDigitado] = useState('')
  
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [copiarCodigo, setCopiarCodigo] = useState('')
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false)

  const subtotal = order?.subtotal || 0
  const desconto = order?.discount_amount || 0
  const valorFrete = opcaoSelecionada?.preco ?? order?.shipping_cost ?? 0
  const totalFinal = subtotal + valorFrete - desconto

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        
        if (orderId) {
          const { data: orderData } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(
                *,
                product:products(*)
              )
            `)
            .eq('id', parseInt(orderId))
            .single()
          
          if (orderData) {
            if (orderData.shipping_address && typeof orderData.shipping_address === 'string') {
              try {
                orderData.shipping_address = JSON.parse(orderData.shipping_address)
              } catch (e) {}
            }
            
            setOrder(orderData)
            
            if (profileData?.cep) {
              setCepDigitado(profileData.cep)
              await calcularFrete(orderData.items, profileData.cep)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError('Erro ao carregar pedido')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [orderId])

  const calcularFrete = async (items: any[], cep: string) => {
    if (!cep || cep.length < 8) {
      setError('Digite um CEP válido')
      return
    }

    // Verifica se todos os produtos são frete grátis
    if (items.every((item: any) => item.product?.free_shipping === true)) {
      const gratis: OpcaoFrete = {
        id: 0,
        servico: 'Frete Grátis',
        transportadora: 'Loja',
        preco: 0,
        prazo: 0,
        gratis: true
      }
      setOpcoesFrete([gratis])
      setOpcaoSelecionada(gratis)
      return
    }

    setCalculandoFrete(true)
    setError(null)

    try {
      const cepLimpo = cep.replace(/\D/g, '')

      const response = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          items: items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: item.price || 0
          }))
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao calcular frete')
      }

      setOpcoesFrete(data.opcoes)
      
      // Seleciona automaticamente a opção mais barata
      if (data.opcoes.length > 0) {
        setOpcaoSelecionada(data.opcoes[0])
      }
      
    } catch (error: any) {
      console.error('Erro ao calcular frete:', error)
      setError(error.message || 'Erro ao calcular frete. Tente novamente.')
      setOpcoesFrete([])
      setOpcaoSelecionada(null)
    } finally {
      setCalculandoFrete(false)
    }
  }

  const salvarFreteNoPedido = async () => {
    if (!orderId || !opcaoSelecionada) return
    try {
      await supabase
        .from('orders')
        .update({
          shipping_cost: opcaoSelecionada.preco,
          total_amount: subtotal + opcaoSelecionada.preco - desconto,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(orderId))
    } catch (e) {
      console.error('Erro ao salvar frete:', e)
    }
  }

  const gerarPix = async () => {
    if (!opcaoSelecionada) {
      setError('Selecione uma opção de frete')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      await salvarFreteNoPedido()

      const customerName = profile?.full_name || user?.user_metadata?.full_name || 'Cliente'
      const customerEmail = user?.email || 'cliente@email.com'

      if (desconto > 0) {
        const { error: debitoError } = await supabase.rpc('debitar_saldo', {
          p_usuario_id: user.id,
          p_valor: desconto,
          p_descricao: 'Uso de créditos na compra - Pedido #' + orderId
        })
        
        if (debitoError) {
          console.error('❌ Erro ao debitar créditos:', debitoError)
          setError('Erro ao usar créditos. Tente novamente.')
          setProcessing(false)
          return
        }
      }

      const response = await fetch('/api/mercadopago/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: totalFinal,
          orderId: parseInt(orderId as string),
          userEmail: customerEmail,
          customerName: customerName,
          items: order?.items || []
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX')
      }

      if (orderId) {
        await supabase
          .from('orders')
          .update({
            customer_name: customerName,
            email: customerEmail
          })
          .eq('id', parseInt(orderId as string))
      }

      if (data.qrCode) {
        setQrCode(data.qrCode)
      } else {
        setError('QR Code não gerado. Tente novamente.')
      }
      
      if (data.codigoPix) {
        setCopiarCodigo(data.codigoPix)
      }

      clearCart()
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PIX:', error)
      setError(error.message || 'Erro ao gerar PIX')
    } finally {
      setProcessing(false)
    }
  }

  const pagarComCartao = async () => {
    if (!orderId) return
    
    if (!opcaoSelecionada) {
      setError('Selecione uma opção de frete')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      await salvarFreteNoPedido()

      if (desconto > 0) {
        const { error: debitoError } = await supabase.rpc('debitar_saldo', {
          p_usuario_id: user.id,
          p_valor: desconto,
          p_descricao: 'Uso de créditos na compra - Pedido #' + orderId
        })

        if (debitoError) {
          console.error('❌ Erro ao debitar créditos:', debitoError)
          setError('Erro ao usar créditos. Tente novamente.')
          setProcessing(false)
          return
        }
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: parseInt(orderId) })
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }

      window.location.href = data.url
    } catch (error: any) {
      console.error('❌ Erro ao pagar com cartão:', error)
      setError(error.message || 'Erro ao processar pagamento')
      setProcessing(false)
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

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Pedido não encontrado</p>
          <Link href="/loja" className="text-[#FFB800] hover:underline mt-2 block">
            Voltar à loja
          </Link>
        </div>
      </div>
    )
  }

  const allFreeShipping = order?.items?.every((item) => item.product?.free_shipping === true) || false

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/loja/carrinho"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Pagamento do Pedido</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
            <span className="font-bold">!</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-black mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={item.product?.image_url || '/images/placeholder.jpg'}
                        alt={item.product?.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg' }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black text-sm">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity}x {formatPrice(item.price)}
                      </p>
                      {item.product?.free_shipping && (
                        <span className="text-xs text-green-600 font-medium">Frete Grátis</span>
                      )}
                    </div>
                    <p className="font-bold text-[#FFB800] text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className={`font-medium ${allFreeShipping || valorFrete === 0 ? 'text-green-600' : ''}`}>
                    {valorFrete === 0 ? 'Grátis' : formatPrice(valorFrete)}
                  </span>
                </div>
                
                {desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto (créditos)</span>
                    <span>- {formatPrice(desconto)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#FFB800]">{formatPrice(totalFinal)}</span>
                </div>
              </div>
            </div>

            {!allFreeShipping && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <Truck size={18} className="text-[#FFB800]" />
                  Calcular Frete
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={cepDigitado}
                    onChange={(e) => setCepDigitado(e.target.value)}
                    placeholder="Digite seu CEP"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                    maxLength={9}
                  />
                  <button
                    onClick={() => calcularFrete(order.items, cepDigitado)}
                    disabled={calculandoFrete}
                    className="px-6 py-2 bg-[#FFB800] text-black rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
                  >
                    {calculandoFrete ? <Loader2 size={18} className="animate-spin" /> : 'Calcular'}
                  </button>
                </div>

                {/* 🆕 Lista de opções de frete */}
                {opcoesFrete.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Escolha uma opção de entrega:</p>
                    {opcoesFrete.map((opcao) => (
                      <button
                        key={`${opcao.id}-${opcao.servico}`}
                        onClick={() => {
                          setOpcaoSelecionada(opcao)
                          salvarFreteNoPedido()
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition text-left ${
                          opcaoSelecionada?.id === opcao.id && opcaoSelecionada?.servico === opcao.servico
                            ? 'border-[#FFB800] bg-[#FFB800]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            opcaoSelecionada?.id === opcao.id && opcaoSelecionada?.servico === opcao.servico
                              ? 'border-[#FFB800] bg-[#FFB800]'
                              : 'border-gray-300'
                          }`}>
                            {opcaoSelecionada?.id === opcao.id && opcaoSelecionada?.servico === opcao.servico && (
                              <Check size={12} className="text-black" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {opcao.transportadora} — {opcao.servico}
                            </p>
                            <p className="text-xs text-gray-500">
                              Entrega em até {opcao.prazo} {opcao.prazo === 1 ? 'dia útil' : 'dias úteis'}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-[#FFB800] text-sm flex-shrink-0">
                          {opcao.preco === 0 ? 'Grátis' : formatPrice(opcao.preco)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {allFreeShipping && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                <span className="font-medium">Frete grátis aplicado a todos os produtos!</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-black mb-4">Forma de Pagamento</h3>

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'pix' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode size={20} className={paymentMethod === 'pix' ? 'text-[#FFB800]' : 'text-gray-500'} />
                  <div className="text-left">
                    <p className="font-medium text-sm">PIX</p>
                    <p className="text-xs text-gray-500">Instantâneo</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('cartao')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'cartao' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={20} className={paymentMethod === 'cartao' ? 'text-[#FFB800]' : 'text-gray-500'} />
                  <div className="text-left">
                    <p className="font-medium text-sm">Cartão</p>
                    <p className="text-xs text-gray-500">Crédito/Débito</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('bdm')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'bdm' ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Wallet size={20} className={paymentMethod === 'bdm' ? 'text-[#FFB800]' : 'text-gray-500'} />
                  <div className="text-left">
                    <p className="font-medium text-sm">BDM</p>
                    <p className="text-xs text-gray-500">Saldo digital</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <button
                  onClick={gerarPix}
                  disabled={processing || !opcaoSelecionada}
                  className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    `Gerar PIX - ${formatPrice(totalFinal)}`
                  )}
                </button>
              )}

              {paymentMethod === 'cartao' && (
                <button
                  onClick={pagarComCartao}
                  disabled={processing || !opcaoSelecionada}
                  className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    `Pagar com Cartão - ${formatPrice(totalFinal)}`
                  )}
                </button>
              )}

              {paymentMethod === 'bdm' && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Em breve disponível</p>
                </div>
              )}

              {qrCode && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">Escaneie o QR Code ou copie o código</p>
                  {copiarCodigo && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(copiarCodigo)
                        alert('Código copiado!')
                      }}
                      className="mt-2 text-sm text-[#FFB800] hover:underline"
                    >
                      Copiar código PIX
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
