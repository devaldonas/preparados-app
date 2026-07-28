// app/loja/checkout/page.tsx
'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import { ArrowLeft, Loader2, Check, Copy, Banknote, Coins, AlertCircle, Truck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
// import { gerarPIX } from '@/lib/pix'; // Não é mais necessário para o fluxo via Mercado Pago

interface OpcaoFrete {
  transportadora: string
  servico: string
  prazo: number
  prazoString: string
  preco: number
  codigo: string
  imagem: string
}

// 🔥 COMPONENTE INTERNO com useSearchParams
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

  // ===================== CARREGAR PEDIDO =====================
  const carregarPedido = async () => {
    try {
      console.log('🔍 Buscando pedido ID:', orderId)

      const orderIdNumber = parseInt(orderId as string)
      if (isNaN(orderIdNumber)) {
        throw new Error('ID do pedido inválido')
      }

      // 1. Buscar o pedido
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

      // 2. Buscar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (
            id,
            name,
            price,
            image_url,
            partner_id,
            is_digital
          )
        `)
        .eq('order_id', orderData.id)

      if (itemsError) {
        console.error('❌ Erro ao buscar itens:', itemsError)
      }

      console.log('📦 Itens encontrados:', itemsData)

      // 3. Buscar parceiro (para frete)
      let partnerZip = null
      if (itemsData && itemsData.length > 0) {
        const firstItem = itemsData[0]
        const partnerId = firstItem.products?.partner_id

        if (partnerId) {
          const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('zip, company_name')
            .eq('id', partnerId)
            .maybeSingle()

          if (!partnerError && partnerData) {
            partnerZip = partnerData.zip
            console.log('📦 Parceiro encontrado:', partnerData)
          } else {
            console.log('⚠️ Erro ao buscar parceiro:', partnerError)
          }
        }
      }

      // 4. Atualizar estado do pedido
      setOrder({ ...orderData, items: itemsData || [] })
      setCepParceiro(partnerZip || '')

      // 5. Verificar se todos os produtos são digitais
      const todosDigitais = itemsData?.every((item: any) => item.products?.is_digital) || false

      if (todosDigitais) {
        console.log('📦 Todos os produtos são digitais - frete grátis')
        setFreteSelecionado(null)
        setOpcoesFrete([])
        setFreteError(null)
      }

      // 6. Se já estiver pago, redirecionar
      if (orderData.payment_status === 'paid') {
        router.push(`/loja/pedidos/${orderData.id}`)
        return
      }

      // 7. Se for PIX, buscar QR Code (opcional)
      if (paymentMethod === 'pix') {
        // Não geramos mais QR Code interno, pois será feito pelo Mercado Pago
        // Removemos a chamada para gerarPIX
        console.log('ℹ️ PIX via Mercado Pago - aguardando redirecionamento')
      }

    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
      setError('Erro ao carregar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ===================== FUNÇÃO CALCULAR FRETE =====================
  const calcularFrete = async () => {
    // ... (mantenha sua função existente)
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

  // ===================== PAGAMENTO PIX VIA MERCADO PAGO =====================
  const processarPagamentoPIX = async () => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // 🔥 BUSCAR E-MAIL DO USUÁRIO
      const { data: userData } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', order.user_id)
        .single()

      if (!userData?.email) {
        throw new Error('E-mail do usuário não encontrado')
      }

      console.log('📧 E-mail do usuário:', userData.email)
      console.log('💰 Total do pedido:', total)

      // 🔥 CRIAR PREFERÊNCIA NO MERCADO PAGO
      const response = await fetch('/api/mercadopago/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: total,
          orderId: order.id,
          userEmail: userData.email,
          items: order.items.map((item: any) => ({
            id: item.product_id,
            name: item.products?.name || 'Produto',
            quantity: item.quantity,
            price: item.price
          }))
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar pagamento')
      }

      console.log('✅ Preferência criada:', result.preferenceId)
      console.log('🔗 Link:', result.initPoint)

      // 🔥 REDIRECIONAR PARA O CHECKOUT DO MERCADO PAGO
      if (result.initPoint) {
        window.location.href = result.initPoint
      } else {
        throw new Error('Link de pagamento não gerado')
      }

    } catch (error) {
      console.error('❌ Erro no pagamento PIX:', error)
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  // ===================== PAGAMENTO BDM =====================
  // (mantenha sua função existente)
  const buscarCotacaoBDM = async () => {
    try {
      const response = await fetch('/api/bdm/cotacao', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ API de cotação retornou erro, usando valor padrão');
        return 13.55;
      }

      const data = await response.json();
      console.log('📊 Cotação BDM - Resposta:', data);

      const preco = data.BRL || 13.55;
      console.log('💰 1 BDM = R$', preco);

      return preco;
    } catch (error) {
      console.error('❌ Erro ao buscar cotação, usando valor padrão:', error);
      return 13.55;
    }
  };

  const gerarPagamentoBDM = async () => {
    if (!order) {
      console.error('❌ Pedido não encontrado');
      setBdmError('Pedido não encontrado');
      return;
    }

    setProcessing(true);
    setBdmError(null);

    try {
      const valorTotal = order.total_amount + (freteSelecionado?.preco || 0);
      console.log('💰 Valor total em Reais:', valorTotal);

      let cotacao = 13.55;
      try {
        cotacao = await buscarCotacaoBDM();
      } catch (error) {
        console.warn('⚠️ Usando cotação padrão (13.55)');
        cotacao = 13.55;
      }

      const valorEmBDM = (valorTotal / cotacao).toFixed(2);

      console.log(`📊 Cotação: 1 BDM = R$ ${cotacao}`);
      console.log(`💎 Valor em BDM: ${valorEmBDM}`);

      if (isNaN(parseFloat(valorEmBDM)) || parseFloat(valorEmBDM) <= 0) {
        throw new Error('Erro ao calcular valor em BDM');
      }

      const response = await fetch('/api/bdm/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(valorEmBDM),
          amountBRL: valorTotal,
          orderId: order.id,
          attachment: `#ORDER-${order.id}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar pagamento BDM');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar pagamento BDM');
      }

      // 🔥 Atualizar pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          transaction_id: result.billingCode,
          payment_method: 'bdm'
        })
        .eq('id', order.id);

      if (updateError) {
        console.warn('⚠️ Erro ao atualizar pedido:', updateError);
      }

      setBdmData({
        qrCode: result.qrCode,
        billingCode: result.billingCode,
        valorBRL: valorTotal,
        valorBDM: valorEmBDM,
        cotacao: cotacao
      });

      console.log('✅ BDM gerado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao gerar BDM:', error);
      setBdmError(error instanceof Error ? error.message : 'Erro ao gerar pagamento BDM');
    } finally {
      setProcessing(false);
    }
  };

  // ===================== RENDERIZAÇÃO =====================
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
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
                        className={`w-full p-3 border-2 rounded-lg transition-all text-left ${freteSelecionado?.codigo === opcao.codigo
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
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${paymentMethod === 'pix' ? 'border-[#FFB800] bg-yellow-50' : 'border-gray-200'
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
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${paymentMethod === 'bdm' ? 'border-[#FFB800] bg-yellow-50' : 'border-gray-200'
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

            {/* PIX - Conteúdo - VIA MERCADO PAGO */}
            {paymentMethod === 'pix' && (
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    🔄 Você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento via PIX.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={processarPagamentoPIX}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-display font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Banknote size={20} />
                      Pagar com PIX - {formatPrice(total)}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400">
                  Pagamento seguro via Mercado Pago
                </p>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm mx-auto">
                      <p className="text-sm text-blue-800">
                        💰 <strong>1 BDM = R$ {bdmData.cotacao?.toFixed(4) || '13.5500'}</strong>
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Total: <strong>{bdmData.valorBDM || '0.00'} BDM</strong>
                        <span className="text-gray-500 text-xs ml-2">
                          (R$ {bdmData.valorBRL?.toFixed(2) || '0.00'})
                        </span>
                      </p>
                    </div>

                    <p className="text-sm text-gray-600">
                      Escaneie o QR Code abaixo para pagar com BDM Digital
                    </p>

                    <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-gray-200">
                      {bdmData.qrCode ? (
                        <img
                          src={bdmData.qrCode}
                          alt="QR Code BDM"
                          className="w-48 h-48"
                          onError={(e) => {
                            e.currentTarget.src = '/images/pix-placeholder.png'
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">QR Code indisponível</span>
                        </div>
                      )}
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

// 🔥 COMPONENTE PRINCIPAL com Suspense
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