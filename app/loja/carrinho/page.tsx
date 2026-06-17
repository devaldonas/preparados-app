'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: {
    name: string
    price: number
    image_url: string
  }
}

export default function Carrinho() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    carregarCarrinho()
  }, [])

  const carregarCarrinho = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/auth/login')
    return
  }

  // Buscar itens do carrinho
  const { data: cartData, error: cartError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)

  if (cartError) {
    console.error('Erro ao carregar carrinho:', cartError)
    setLoading(false)
    return
  }

  if (!cartData || cartData.length === 0) {
    setCartItems([])
    setLoading(false)
    return
  }

  // Buscar produtos relacionados
  const productIds = cartData.map(item => item.product_id)
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .in('id', productIds)

  if (productsError) {
    console.error('Erro ao carregar produtos:', productsError)
    setLoading(false)
    return
  }

  // Combinar os dados
  const formattedItems = cartData.map(item => {
    const product = productsData.find(p => p.id === item.product_id)
    return {
      id: item.id,
      quantity: item.quantity,
      product_id: item.product_id,
      product: {
        name: product?.name || 'Produto nao encontrado',
        price: product?.price || 0,
        image_url: product?.image_url || '/images/produtos/placeholder.jpg'
      }
    }
  })

  setCartItems(formattedItems)
  setLoading(false)
}

  const atualizarQuantidade = async (itemId: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
      await removerItem(itemId)
      return
    }

    await supabase
      .from('cart_items')
      .update({ quantity: novaQuantidade })
      .eq('id', itemId)

    await carregarCarrinho()
  }

  const removerItem = async (itemId: number) => {
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    await carregarCarrinho()
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity)
    }, 0)
  }

  const gerarPix = async () => {
    setProcessing(true)
    
    // Simular geração de PIX
    const pixCode = '00020126360014BR.GOV.BCB.PIX0114empresa@preparado.com5204000053039865406100.005802BR5913PREPARADO6009SAO PAULO62070503***6304E2F9'
    const pixQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`
    
    return { pixCode, pixQrCode }
  }

  const processarCheckout = async () => {
    if (cartItems.length === 0) return

    setProcessing(true)
    const { data: { user } } = await supabase.auth.getUser()

    let transactionId = ''
    let paymentData = null

    if (paymentMethod === 'pix') {
      paymentData = await gerarPix()
      transactionId = 'PIX_' + Date.now()
    } else {
      // BDM Digital - redirecionar para gateway
      transactionId = 'BDM_' + Date.now()
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id,
        total_amount: getTotal(),
        payment_method: paymentMethod,
        payment_status: 'pending',
        transaction_id: transactionId,
        status: 'pending'
      })
      .select()
      .single()

    if (order && !error) {
      for (const item of cartItems) {
        await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price
          })
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id)

      if (paymentMethod === 'pix' && paymentData) {
        alert(`Pagamento PIX gerado!\n\nCopie o codigo:\n${paymentData.pixCode}`)
        router.push('/loja/confirmacao')
      } else {
        window.location.href = 'https://bdm.digital/checkout'
      }
    }

    setProcessing(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">      
          <h1 className="text-2xl font-bold text-black mb-6">Meu Carrinho</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500 mb-4">Seu carrinho esta vazio</p>
              <Link
                href="/loja"
                className="inline-block bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
              >
                Continuar Comprando
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img 
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => { e.currentTarget.style.display ='none' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-[#FFB800] font-bold">{formatPrice(item.product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => atualizarQuantidade(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removerItem(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-[#FFB800]">{formatPrice(getTotal())}</span>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition"
                >
                  Finalizar Compra
                </button>
              </div>
            </>
          )}

          {/* Modal de Checkout */}
          {checkoutOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Finalizar Pedido</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="pix"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className="w-4 h-4 text-[#FFB800]"
                        />
                        <span>PIX (pagamento instantaneo)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="bdm"
                          checked={paymentMethod === 'bdm'}
                          onChange={() => setPaymentMethod('bdm')}
                          className="w-4 h-4 text-[#FFB800]"
                        />
                        <span>BDM Digital (saldo digital)</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(getTotal())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#FFB800]">{formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processarCheckout}
                    disabled={processing}
                    className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
                  >
                    {processing ? 'Processando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
        <div className="mt-8 space-y-4">
        <Link
          href="/loja"
          className="block text-center bg-gray-300 text-gray-700 px-4 rounded-lg font-semibold hover:bg-gray-200 transition h-9 flex items-center justify-center"
        >
          <span>←</span> Voltar para Loja
        </Link>

        <div>
          <BotaoIndicarAmigo />
        </div>
      </div>
    </div>
  </div>
  </div>
)
}