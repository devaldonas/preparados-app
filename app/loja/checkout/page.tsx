// app/loja/checkout/page.tsx (COMPLETO CORRIGIDO)
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import { ArrowLeft, Loader2, Check, Copy, Banknote, Coins, AlertCircle, Truck } from 'lucide-react'

interface OpcaoFrete {
  transportadora: string
  servico: string
  prazo: number
  prazoString: string
  preco: number
  codigo: string
  imagem: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [pixData, setPixData] = useState<any>(null)
  const [bdmData, setBdmData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bdmError, setBdmError] = useState<string | null>(null)
  const { clearCart } = useCart()
  
  // Estados para o frete
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null)
  const [cepCliente, setCepCliente] = useState('')
  const [cepParceiro, setCepParceiro] = useState('')
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteError, setFreteError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Nenhum pedido encontrado')
      setLoading(false)
      return
    }
    carregarPedido()
  }, [orderId])

  // 🔥 FUNÇÃO CARREGAR PEDIDO
  const carregarPedido = async () => {
  try {
    console.log('🔍 OrderId recebido:', orderId)
    
    // 🔥 Verificar se o orderId é válido
    if (!orderId || isNaN(parseInt(orderId))) {
      console.error('❌ OrderId inválido:', orderId)
      setError('Pedido inválido')
      setLoading(false)
      return
    }

    const orderIdNumber = parseInt(orderId)
    console.log('🔍 Buscando pedido ID:', orderIdNumber)
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderIdNumber)
      .single()

      if (orderError) {
        console.error('❌ Erro ao buscar pedido:', orderError)
        throw orderError
      }

      console.log('✅ Pedido encontrado:', orderData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (
            id,
            name,
            price,
            image_url,
            partner_id
          )
        `)
        .eq('order_id', orderData.id)

      if (itemsError) {
        console.error('❌ Erro ao buscar itens:', itemsError)
      }

      let partnerCep = null
      if (itemsData && itemsData.length > 0) {
        const firstItem = itemsData[0]
        if (firstItem.products?.partner_id) {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('cep, company_name')
            .eq('id', firstItem.products.partner_id)
            .single()
          
          if (partnerData) {
            partnerCep = partnerData.cep
            console.log('📦 Parceiro encontrado:', partnerData)
          }
        }
      }

      setOrder({ ...orderData, items: itemsData || [] })
      setCepParceiro(partnerCep || '')

      if (orderData.payment_status === 'paid') {
        router.push(`/loja/pedidos/${orderData.id}`)
        return
      }

      const chavePix = '13132276847'
      const valor = orderData.total_amount.toFixed(2)
      const qrCodeData = `00020126580014BR.GOV.BCB.PIX0136${chavePix}5204000053039865404${valor}5802BR5913PREPARADO6009SAO PAULO62070503***6304`
      
      setPixData({
        qrCode: qrCodeData,
        copyPaste: qrCodeData
      })

    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
      setError('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 FUNÇÃO CALCULAR FRETE
  const calcularFrete = async () => {
    if (!cepCliente || cepCliente.replace(/\D/g, '').length !== 8) {
      setFreteError('Digite um CEP válido com 8 dígitos')
      return
    }

    if (!cepParceiro) {
      setFreteError('CEP do parceiro não encontrado')
      return
    }

    setCalculandoFrete(true)
    setFreteError(null)

    try {
      const produtos = order.items?.map((item: any) => ({
        id: item.product_id,
        nome: item.products?.name || 'Produto',
        peso: 1,
        altura: 20,
        largura: 20,
        comprimento: 20,
        quantidade: item.quantity,
        valor: item.price
      })) || []

      const response = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cepCliente.replace(/\D/g, ''),
          produtos: produtos,
          cepOrigem: cepParceiro.replace(/\D/g, '')
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular frete')
      }

      setOpcoesFrete(data.cotacoes || [])
      
      if (data.cotacoes?.length === 0) {
        setFreteError('Nenhuma opção de frete disponível para este CEP')
      }

    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      setFreteError(error instanceof Error ? error.message : 'Erro ao calcular frete')
      setOpcoesFrete([])
    } finally {
      setCalculandoFrete(false)
    }
  }

  // 🔥 FUNÇÃO GERAR PAGAMENTO BDM
  const gerarPagamentoBDM = async () => {
    if (!order) return

    setProcessing(true)
    setBdmError(null)

    try {
      const valorTotal = order.total_amount + (freteSelecionado?.preco || 0)
      
      const response = await fetch('/api/bdm/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: valorTotal,
          orderId: order.id,
          attachment: `#ORDER-${order.id}`
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar pagamento BDM')
      }

      setBdmData({
        qrCode: result.qrCode,
        billingCode: result.billingCode
      })

      await supabase
        .from('orders')
        .update({ 
          transaction_id: result.billingCode,
          payment_method: 'bdm'
        })
        .eq('id', order.id)

    } catch (error) {
      console.error('Erro ao gerar BDM:', error)
      setBdmError(error instanceof Error ? error.message : 'Erro ao gerar pagamento BDM')
    } finally {
      setProcessing(false)
    }
  }

  // 🔥 FUNÇÃO CONFIRMAR PAGAMENTO PIX
  const confirmarPagamentoPIX = async () => {
    if (!order) return

    setProcessing(true)
    setError(null)
    
    try {
      const valorFrete = freteSelecionado?.preco || 0
      const valorFinal = order.total_amount + valorFrete

      if (valorFrete > 0) {
        await supabase
          .from('orders')
          .update({
            total_amount: valorFinal,
            shipping_cost: valorFrete,
            shipping_service: freteSelecionado?.servico || '',
            shipping_carrier: freteSelecionado?.transportadora || '',
            shipping_cep_origem: cepParceiro,
            shipping_cep_destino: cepCliente,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      clearCart()
      router.push(`/loja/pedidos/${order.id}`)
      
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error)
      setError('Erro ao confirmar pagamento. Tente novamente.')
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const subtotal = order?.total_amount || 0
  const frete = freteSelecionado?.preco || 0
  const total = subtotal + frete

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            {error || 'Pedido não encontrado'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Não foi possível encontrar o pedido. Verifique o ID ou tente novamente.
          </p>
          <Link
            href="/loja/carrinho"
            className="inline-block bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Voltar ao carrinho
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Banknote size={32} className="text-[#FFB800]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Pagamento do Pedido
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pedido #{order.transaction_id?.slice(-8) || order.id}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Realizado em {formatDate(order.created_at)}
            </p>
          </div>

          {/* Resumo do pedido */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-display font-bold text-gray-900 text-sm mb-3">
              Resumo do Pedido
            </h3>
            
            <div className="space-y-2">
              {order.items && order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.products?.name || `Produto ${item.product_id}`}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">
                    {freteSelecionado ? formatPrice(frete) : 'A definir'}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#FFB800]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {cepParceiro && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <Truck size={14} className="inline mr-1" />
                  Produto enviado por parceiro
                </p>
              </div>
            )}
          </div>

          {/* Calculador de Frete */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-display font-bold text-gray-900 text-sm mb-3">
              Calcular Frete
            </h3>
            
            {cepParceiro ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Seu CEP (destino)
                    </label>
                    <input
                      type="text"
                      value={cepCliente}
                      onChange={(e) => setCepCliente(e.target.value)}
                      placeholder="Digite seu CEP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                      maxLength={9}
                    />
                  </div>
                  <button
                    onClick={calcularFrete}
                    disabled={calculandoFrete}
                    className="px-4 py-2 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 self-end"
                  >
                    {calculandoFrete ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Truck size={18} />
                        Calcular
                      </>
                    )}
                  </button>
                </div>

                {freteError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                    {freteError}
                  </div>
                )}

                {opcoesFrete.length > 0 && (
                  <div className="space-y-2">
                    {opcoesFrete.map((opcao) => (
                      <button
                        key={opcao.codigo}
                        onClick={() => setFreteSelecionado(opcao)}
                        className={`w-full p-3 border-2 rounded-lg transition-all text-left ${
                          freteSelecionado?.codigo === opcao.codigo
                            ? 'border-[#FFB800] bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {opcao.transportadora}
                            </p>
                            <p className="text-xs text-gray-500">{opcao.servico}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#FFB800] text-sm">
                              {formatPrice(opcao.preco)}
                            </p>
                            <p className="text-xs text-gray-500">{opcao.prazoString}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                ⚠️ CEP do parceiro não encontrado.
              </p>
            )}
          </div>

          {/* Escolha do Método de Pagamento */}
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-bold text-gray-900 text-sm mb-3">
                Forma de Pagamento
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    paymentMethod === 'pix' ? 'border-[#FFB800] bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote size={20} className="text-[#FFB800]" />
                    <p className="font-display font-bold text-gray-900">PIX</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Pagamento instantâneo</p>
                </button>

                <button
                  onClick={() => {
                    setPaymentMethod('bdm')
                    if (!bdmData && !processing) {
                      gerarPagamentoBDM()
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    paymentMethod === 'bdm' ? 'border-[#FFB800] bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins size={20} className="text-[#FFB800]" />
                    <p className="font-display font-bold text-gray-900">BDM Digital</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Pagamento com saldo digital</p>
                </button>
              </div>
            </div>

            {/* PIX - Conteúdo */}
            {paymentMethod === 'pix' && pixData && (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Escaneie o QR Code abaixo para pagar com PIX
                </p>

                <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-gray-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.qrCode)}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                    onError={(e) => {
                      e.currentTarget.src = '/images/pix-placeholder.png'
                    }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.copyPaste)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 3000)
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#FFB800] transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado!' : 'Copiar código PIX'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={confirmarPagamentoPIX}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-display font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Finalizar Pedido - {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* BDM Digital - Conteúdo */}
            {paymentMethod === 'bdm' && (
              <div className="text-center space-y-4">
                {processing && !bdmData && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 size={40} className="animate-spin text-[#FFB800]" />
                    <p className="text-sm text-gray-600 mt-4">Gerando pagamento BDM...</p>
                  </div>
                )}

                {bdmError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Erro ao gerar BDM</p>
                        <p className="text-sm text-red-600">{bdmError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {bdmData && (
                  <>
                    <p className="text-sm text-gray-600">
                      Escaneie o QR Code abaixo para pagar com BDM Digital
                    </p>

                    <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-gray-200">
                      <img 
                        src={bdmData.qrCode}
                        alt="QR Code BDM"
                        className="w-48 h-48"
                        onError={(e) => {
                          e.currentTarget.src = '/images/pix-placeholder.png'
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bdmData.billingCode)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 3000)
                        }}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#FFB800] transition-colors"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copiado!' : 'Copiar código BDM'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      O pagamento será confirmado automaticamente após a transação.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}