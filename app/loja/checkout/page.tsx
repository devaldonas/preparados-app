// app/loja/checkout/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import { ArrowLeft, Loader2, Check, Copy, Banknote, Coins, AlertCircle } from 'lucide-react'

function CheckoutContent() {
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
  const [cotacaoBDM, setCotacaoBDM] = useState<number | null>(null)
  const [valorBDM, setValorBDM] = useState<number | null>(null)
  const [buscandoCotacao, setBuscandoCotacao] = useState(false)
  const { clearCart } = useCart()

  useEffect(() => {
    if (!orderId) {
      setError('Nenhum pedido encontrado')
      setLoading(false)
      return
    }
    carregarPedido()
  }, [orderId])

  const carregarPedido = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parseInt(orderId as string))
        .single()

      if (orderError) throw orderError

      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id)

      setOrder({ ...orderData, items: items || [] })

      if (orderData.payment_status === 'paid') {
        router.push(`/loja/pedidos/${orderData.id}`)
        return
      }

      // Gerar QR Code PIX com a chave CPF
      const chavePix = '13132276847' // CPF sem pontuação
      const valor = orderData.total_amount.toFixed(2)
      
      const qrCodeData = `00020126580014BR.GOV.BCB.PIX0136${chavePix}5204000053039865404${valor}5802BR5913PREPARADO6009SAO PAULO62070503***6304`
      
      setPixData({
        qrCode: qrCodeData,
        copyPaste: qrCodeData
      })

    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      setError('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar cotação BDM
  const buscarCotacaoBDM = async (valorReais: number) => {
    setBuscandoCotacao(true)
    try {
      console.log('📊 Buscando cotação BDM para:', valorReais)
      
      const response = await fetch('/api/bdm/quotation')
      const result = await response.json()
      
      console.log('📥 Resposta cotação:', result)
      
      if (!result.success || !result.quotation) {
        throw new Error('Não foi possível obter a cotação BDM')
      }
      
      const cotacao = result.quotation
      setCotacaoBDM(cotacao)
      
      // Calcular valor em BDM com 2 casas decimais
      const valorEmBDM = valorReais / cotacao
      const valorBDMFormatado = parseFloat(valorEmBDM.toFixed(2))
      
      setValorBDM(valorBDMFormatado)
      
      console.log(`✅ Cotação: 1 BDM = R$ ${cotacao}`)
      console.log(`🪙 Valor em BDM: ${valorBDMFormatado}`)
      
      return cotacao
      
    } catch (error) {
      console.error('❌ Erro ao buscar cotação:', error)
      setError('Erro ao buscar cotação BDM. Tente novamente mais tarde.')
      return null
    } finally {
      setBuscandoCotacao(false)
    }
  }

  const gerarPagamentoBDM = async () => {
    if (!order) return

    setProcessing(true)
    setBdmError(null)

    try {
      // Buscar a cotação atual
      const cotacao = await buscarCotacaoBDM(order.total_amount)
      
      if (!cotacao) {
        throw new Error('Não foi possível obter a cotação BDM')
      }
      
      // Calcular valor em BDM com 2 casas decimais
      const valorEmBDM = order.total_amount / cotacao
      const valorBDMFormatado = parseFloat(valorEmBDM.toFixed(2))
      
      console.log('🪙 Gerando pagamento BDM:', {
        valorReais: order.total_amount,
        cotacao: cotacao,
        valorBDM: valorBDMFormatado
      })

      // Salvar no estado
      setCotacaoBDM(cotacao)
      setValorBDM(valorBDMFormatado)

      // Enviar o valor em BDM para a API
      const response = await fetch('/api/bdm/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: valorBDMFormatado,
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

      // Salvar billingCode no pedido
      await supabase
        .from('orders')
        .update({ 
          transaction_id: result.billingCode,
          payment_method: 'bdm'
        })
        .eq('id', order.id)

    } catch (error) {
      console.error('❌ Erro ao gerar BDM:', error)
      setBdmError(error instanceof Error ? error.message : 'Erro ao gerar pagamento BDM')
    } finally {
      setProcessing(false)
    }
  }

  const confirmarPagamento = async () => {
    if (!order) return

    try {
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

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-display font-bold text-gray-900 text-sm mb-3">
              Resumo do Pedido
            </h3>
            
            <div className="space-y-2">
              {order.items && order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name || `Produto ${item.product_id}`}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">Grátis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#FFB800]">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

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
                  onClick={confirmarPagamento}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-display font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Já paguei - Confirmar
                </button>
              </div>
            )}

            {paymentMethod === 'bdm' && (
              <div className="text-center space-y-4">
                {buscandoCotacao && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 size={40} className="animate-spin text-[#FFB800]" />
                    <p className="text-sm text-gray-600 mt-4">Buscando cotação BDM...</p>
                  </div>
                )}

                {processing && !bdmData && !buscandoCotacao && (
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

                    {/* Conversão BRL -> BDM */}
                    {cotacaoBDM && valorBDM && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Valor em BRL</span>
                          <span className="text-gray-900 font-medium">
                            R$ {order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cotação BDM</span>
                          <span className="text-gray-900 font-medium">
                            1 BDM = R$ {cotacaoBDM.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-900">Valor em BDM</span>
                          <span className="text-[#FFB800]">
                            {valorBDM.toFixed(2)} BDM
                          </span>
                        </div>
                      </div>
                    )}

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}