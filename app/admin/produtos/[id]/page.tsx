// app/loja/produto/[id]/page.tsx (VISUALIZAÇÃO PÚBLICA - PARA CLIENTES)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/store/cart'
import { ArrowLeft, ShoppingBag, Heart, Share2, Star, Check, Truck } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  images: string[]
  stock: number
  mochila_tipo: string[]
  specifications?: any
  rating?: number
  reviews_count?: number
}

export default function ProdutoDetalhe({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { addItem } = useCart()

  useEffect(() => {
    carregarUsuario()
    carregarProduto()
  }, [params.id])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const carregarProduto = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erro ao carregar produto:', error)
        router.push('/loja')
        return
      }

      setProduct(data)
      if (data.images && data.images.length > 0) {
        setSelectedImage(0)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const adicionarAoCarrinho = () => {
    if (!product) return

    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.images?.[0] || '',
      max_stock: product.stock,
    }, quantity)

    // Feedback visual
    const btn = document.getElementById('add-to-cart')
    if (btn) {
      const originalText = btn.textContent
      btn.textContent = 'Adicionado! ✓'
      btn.className = 'flex-1 bg-green-500 text-white font-display font-bold py-3 rounded-lg transition flex items-center justify-center gap-2'
      setTimeout(() => {
        btn.textContent = originalText
        btn.className = 'flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold py-3 rounded-lg transition flex items-center justify-center gap-2'
      }, 2000)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Função para gerar estrelas de avaliação
  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const stars = []
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="fill-[#FFB800] text-[#FFB800]" />)
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="fill-[#FFB800] text-[#FFB800] opacity-50" />)
    }
    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />)
    }
    
    return stars
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Produto não encontrado</p>
          <Link href="/loja" className="text-[#FFB800] hover:underline inline-block">
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

  // Array de imagens para exibição
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
      ? [product.image_url] 
      : ['/images/placeholder.jpg']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação superior */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
          <Link href="/loja" className="text-sm text-gray-600 hover:text-gray-900">
            🏠 Loja
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
            {/* Galeria de Imagens */}
            <div className="space-y-3">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={allImages[selectedImage] || '/images/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.jpg'
                  }}
                />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-6 py-2 rounded-lg font-display font-bold text-lg">
                      ESGOTADO
                    </span>
                  </div>
                )}
                {product.stock > 0 && product.stock < 5 && (
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                    Últimas unidades
                  </span>
                )}
              </div>

              {/* Miniaturas */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index 
                          ? 'border-[#FFB800]' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder.jpg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div className="flex flex-col">
              <div className="flex-1">
                {/* Categoria e Avaliação */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-display tracking-wider uppercase bg-gray-100 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {renderStars(product.rating)}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviews_count || 0})
                      </span>
                    </div>
                  )}
                </div>

                <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>

                {/* Preço */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display text-3xl font-bold text-[#FFB800]">
                    {formatPrice(product.price)}
                  </span>
                  {product.stock > 0 && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check size={14} />
                      Em estoque
                    </span>
                  )}
                </div>

                {/* Descrição */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h3 className="text-sm font-display font-bold text-gray-700 mb-2">
                    Descrição
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description || 'Sem descrição disponível.'}
                  </p>
                </div>

                {/* Compatibilidade */}
                {product.mochila_tipo && product.mochila_tipo.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <h3 className="text-sm font-display font-bold text-gray-700 mb-2">
                      Compatível com:
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {product.mochila_tipo.map((tipo) => (
                        <span 
                          key={tipo} 
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium"
                        >
                          {tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Especificações */}
                {product.specifications && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-display font-bold text-gray-700 mb-2">
                      Especificações
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[0.6rem] text-gray-500 uppercase">{key}</p>
                          <p className="text-sm text-gray-700 font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ações de Compra */}
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  {/* Seletor de quantidade */}
                  {product.stock > 0 && (
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 hover:bg-gray-50 transition text-gray-600"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-display font-bold min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-3 py-2 hover:bg-gray-50 transition text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    id="add-to-cart"
                    onClick={adicionarAoCarrinho}
                    disabled={product.stock === 0}
                    className={`flex-1 font-display font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                      product.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#FFB800] hover:bg-[#E5A600] text-black'
                    }`}
                  >
                    <ShoppingBag size={20} />
                    {product.stock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`flex-1 border-2 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm ${
                      isWishlisted
                        ? 'border-red-500 text-red-500 bg-red-50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Heart size={18} className={isWishlisted ? 'fill-red-500' : ''} />
                    {isWishlisted ? 'Salvo' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: `Confira ${product.name} na Loja Preparado!`,
                          url: window.location.href
                        })
                      }
                    }}
                    className="border-2 border-gray-200 py-2 px-4 rounded-lg hover:border-gray-300 transition"
                  >
                    <Share2 size={18} className="text-gray-600" />
                  </button>
                </div>

                {/* Selo de frete grátis */}
                {product.price >= 100 && (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm bg-green-50 py-2 rounded-lg">
                    <Truck size={16} />
                    <span className="font-display font-bold">Frete Grátis</span>
                    <span className="text-xs">(compras acima de R$ 100)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Produtos relacionados (opcional) */}
        <div className="mt-8">
          <h3 className="font-display font-bold text-gray-900 mb-4">
            Você também pode gostar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}