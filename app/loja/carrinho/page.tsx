'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/store/cart'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'

export default function Carrinho() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('pix')

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()
  
  // 🔥 VERIFICAR SE TODOS OS ITENS SÃO DIGITAIS
  const todosDigitais = items.every(item => item.is_digital === true)
  
  // 🔥 CALCULAR FRETE: GRÁTIS PARA DIGITAIS, 15.90 PARA FÍSICOS
  const shipping = todosDigitais ? 0 : 15.90
  const total = subtotal + shipping

  useEffect(() => {
    carregarUsuario()
  }, [])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const processarCheckout = async () => {
    if (items.length === 0) return

    setProcessing(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('cep, full_name, street, number, complement, neighborhood, city, state')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError)
      }

      const shippingAddress = {
        zip: profile?.cep || '',
        street: profile?.street || '',
        number: profile?.number || '',
        complement: profile?.complement || '',
        neighborhood: profile?.neighborhood || '',
        city: profile?.city || '',
        state: profile?.state || '',
      }

      const orderNumber = `PRE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      const orderData = {
        user_id: user.id,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
        transaction_id: orderNumber,
        shipping_address: JSON.stringify(shippingAddress)
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError)
        setError('Erro ao criar pedido. Tente novamente.')
        setProcessing(false)
        return
      }

      for (const item of items) {
        await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          })
      }

      clearCart()
      router.push(`/loja/checkout?order=${order.id}`)
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      setError('Erro ao processar pedido. Tente novamente.')
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
              <h1 className="text-2xl font-bold text-black">Meu Carrinho</h1>
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
                        {item.is_digital && (
                          <span className="text-[0.55rem] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Produto Digital
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-50 transition rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 py-1 min-w-[30px] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-50 transition rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id)}
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
                  onClick={clearCart}
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

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
                      {shipping === 0 ? (
                        <span className="text-green-600">Grátis</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  {todosDigitais && items.length > 0 && (
                    <p className="text-[0.6rem] text-blue-600 text-right">
                      📦 Produto digital - Frete grátis
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
                  onClick={processarCheckout}
                  disabled={processing || items.length === 0}
                  className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Processando...
                    </>
                  ) : (
                    `Finalizar Compra - ${formatPrice(total)}`
                  )}
                </button>
              </div>
            </>
          )}

          <div className="mt-8 space-y-4">
            <Link
              href="/loja"
              className="text-center bg-gray-300 text-gray-700 px-4 rounded-lg font-semibold hover:bg-gray-200 transition h-9 flex items-center justify-center"
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