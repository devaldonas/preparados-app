// app/loja/carrinho/page.tsx (CORRIGIDO - versão simplificada)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/store/cart'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, X } from 'lucide-react'

export default function Carrinho() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [localItems, setLocalItems] = useState<any[]>([])

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()
  const shipping = subtotal > 100 ? 0 : 15.90
  const total = subtotal + shipping

  useEffect(() => {
    carregarUsuario()
  }, [])

  useEffect(() => {
    // Atualizar itens locais quando o carrinho mudar
    setLocalItems(items)
  }, [items])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    await sincronizarCarrinho()
    setLoading(false)
  }

  const sincronizarCarrinho = async () => {
    if (!user) return

    // Buscar itens do Supabase
    const { data: cartData } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)

    if (cartData && cartData.length > 0) {
      // Se há itens no Supabase, sincronizar com Zustand
      const productIds = cartData.map(item => item.product_id)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, image_url, stock')
        .in('id', productIds)

      if (productsData) {
        // Limpar e recriar carrinho
        clearCart()
        
        for (const item of cartData) {
          const product = productsData.find(p => p.id === item.product_id)
          if (product) {
            // Usar o método addItem diretamente
            const { addItem } = useCart.getState()
            addItem({
              product_id: item.product_id,
              name: product.name,
              price: product.price,
              image: product.image_url,
              max_stock: product.stock || 999,
            }, item.quantity)
          }
        }
      }
    }
  }

  const atualizarQuantidade = async (productId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
      await removerItem(productId)
      return
    }

    // Atualizar no Zustand
    updateQuantity(productId, novaQuantidade)

    // Atualizar no Supabase
    const item = items.find(i => i.product_id === productId)
    if (item && user) {
      await supabase
        .from('cart_items')
        .update({ quantity: novaQuantidade })
        .eq('user_id', user.id)
        .eq('product_id', productId)
    }
  }

  const removerItem = async (productId: string) => {
    // Remover do Zustand
    removeItem(productId)

    // Remover do Supabase
    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
    }
  }

  const limparCarrinho = async () => {
    if (!user) return

    // Limpar Zustand
    clearCart()

    // Limpar Supabase
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
  }

 // app/loja/carrinho/page.tsx - Função processarCheckout corrigida

// app/loja/carrinho/page.tsx - Função processarCheckout corrigida

const processarCheckout = async () => {
  if (items.length === 0) return

  setProcessing(true)
  
  try {
    const transactionId = `PRE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Dados do pedido - correspondendo exatamente à estrutura da tabela
    const orderData = {
      user_id: user?.id,
      total_amount: total,
      payment_method: paymentMethod,
      payment_status: 'pending',
      transaction_id: transactionId,
      status: 'pending',
      shipping_address: JSON.stringify({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: ''
      })
    }

    console.log('Enviando pedido:', orderData)

    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado do Supabase:', error)
      alert(`Erro ao criar pedido: ${error.message}`)
      setProcessing(false)
      return
    }

    // Inserir itens do pedido na tabela order_items (se existir)
    // Se não existir, vamos criar
    if (order) {
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          })
        
        if (itemError) {
          console.error('Erro ao inserir item:', itemError)
        }
      }
    }

    // Limpar carrinho
    await limparCarrinho()

    // Redirecionar para checkout com o ID do pedido
    router.push(`/loja/checkout?order=${order.id}`)
    
  } catch (error) {
    console.error('Erro ao processar pedido:', error)
    alert('Erro ao processar pedido. Tente novamente.')
  } finally {
    setProcessing(false)
    setCheckoutOpen(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-black">🛒 Meu Carrinho</h1>
            </div>
            {items.length > 0 && (
              <span className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
              <Link
                href="/loja"
                className="inline-block bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
              >
                Explorar Produtos
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.product_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg' 
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-[#FFB800] font-bold">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => atualizarQuantidade(item.product_id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-50 transition rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 py-1 min-w-[30px] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => atualizarQuantidade(item.product_id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-50 transition rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removerItem(item.product_id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={limparCarrinho}
                  className="text-sm text-gray-500 hover:text-red-500 transition"
                >
                  Limpar Carrinho
                </button>
                <Link
                  href="/loja"
                  className="text-sm text-[#FFB800] hover:underline"
                >
                  + Continuar comprando
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-display font-bold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className="text-gray-900 font-display font-bold">
                      {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping === 0 && subtotal > 0 && (
                    <p className="text-[0.6rem] text-green-600 text-right">
                      🎉 Frete grátis para compras acima de R$ 100,00
                    </p>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-bold text-gray-900">Total</span>
                      <span className="font-display font-bold text-2xl text-[#FFB800]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
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
            
            <CarouselFooter />
          </div>
        </div>
      </div>

      {/* Modal de Checkout */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Finalizar Pedido</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={paymentMethod === 'pix'}
                      onChange={() => setPaymentMethod('pix')}
                      className="w-4 h-4 text-[#FFB800] focus:ring-[#FFB800]"
                    />
                    <div>
                      <span className="font-medium">PIX</span>
                      <p className="text-xs text-gray-500">Pagamento instantâneo</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition opacity-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      disabled
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Cartão de Crédito</span>
                      <p className="text-xs text-gray-500">Em breve</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span>{shipping === 0 ? 'Grátis' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-[#FFB800]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={processarCheckout}
                disabled={processing}
                className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    Processando...
                  </div>
                ) : (
                  `Confirmar Pedido - ${formatPrice(total)}`
                )}
              </button>

              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}