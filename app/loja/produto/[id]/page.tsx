'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'
import GaleriaProduto from '@/components/GaleriaProduto'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image_url: string
  images: string[]
  stock: number
  mochila_tipo: string[]
}

export default function DetalheProduto() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  useEffect(() => {
    carregarProduto()
    carregarCarrinhoCount()
  }, [])

  const carregarProduto = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      console.error('Erro ao carregar produto:', error)
      router.push('/loja')
    } else {
      setProduct(data)
    }
    setLoading(false)
  }

  const carregarCarrinhoCount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setCartCount(count || 0)
  }

  const adicionarAoCarrinho = async () => {
    if (!product) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setAdding(true)

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: quantity
        })
    }

    await carregarCarrinhoCount()
    setAdding(false)
    
    // Feedback visual
    const btn = document.getElementById('btn-add-cart')
    if (btn) {
      const originalText = btn.textContent
      btn.textContent = 'Adicionado!'
      setTimeout(() => {
        btn.textContent = originalText
      }, 1500)
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

  if (!product) return null

  const imagesList = product.images || (product.image_url ? [product.image_url] : [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Header com ícone do carrinho */}
          <div className="flex justify-between items-center mb-4">
            
            
            <Link
              href="/loja/carrinho"
              className="relative bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFB800] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>

          {/* Detalhe do produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Galeria de imagens */}
            <GaleriaProduto 
              images={imagesList}
              productName={product.name}
            />

            {/* Informacoes do produto */}
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-500 text-sm">{product.category}</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Preco</span>
                  <span className="text-2xl font-bold text-[#FFB800]">{formatPrice(product.price)}</span>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Estoque</span>
                  <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} unidades` : 'Esgotado'}
                  </span>
                </div>

                {product.stock > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-gray-600">Quantidade</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      id="btn-add-cart"
                      onClick={adicionarAoCarrinho}
                      disabled={adding}
                      className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>🛒</span>
                      {adding ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                    </button>
                  </>
                )}

                {product.stock === 0 && (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Produto Esgotado
                  </button>
                )}
              </div>

              {/* Tipos de mochila compatíveis */}
              {product.mochila_tipo && product.mochila_tipo.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Compatível com:</h3>
                  <div className="flex gap-2">
                    {product.mochila_tipo.map((tipo) => (
                      <span key={tipo} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {tipo === 'EDC' ? 'EDC - Dia a dia' : tipo === 'BOB' ? 'BOB - 72h' : 'BOLT - Longo prazo'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/loja"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span>←</span> Voltar para Loja
            </Link>
            
          </div>
        </div>
      </div>
    </div>
  )
}