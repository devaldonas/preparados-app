'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock: number
  mochila_tipo: string[]
}

export default function Loja() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 4
  const router = useRouter()

  useEffect(() => {
    carregarUsuario()
  }, [])

  useEffect(() => {
    if (user) {
      carregarProdutos()
      carregarCarrinhoCount()
    }
  }, [user, selectedCategory])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const carregarProdutos = async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (selectedCategory !== 'todos') {
      query = query.eq('category', selectedCategory)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar produtos:', error)
    } else {
      setProducts(data || [])
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])]
      setCategories(uniqueCategories)
    }
  }

  const carregarCarrinhoCount = async () => {
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    if (!error) {
      setCartCount(count || 0)
    }
  }

  const adicionarAoCarrinho = async (product: Product) => {
    if (!user) return

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1
        })
    }

    await carregarCarrinhoCount()
    
    const btn = document.getElementById(`btn-${product.id}`)
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

  // Paginacao
  const totalPages = Math.ceil(products.length / productsPerPage)
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginar = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          
          

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">Loja Preparado</h1>
              <p className="text-gray-500 text-sm">Equipamentos essenciais para sua mochila</p>
            </div>
            <Link
              href="/loja/carrinho"
              className="relative bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FFB800] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            <button
              onClick={() => {
                setSelectedCategory('todos')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === 'todos'
                  ? 'bg-[#FFB800] text-black'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-[#FFB800] text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de produtos - 2 colunas em todos os dispositivos */}
<div className="grid grid-cols-2 gap-3 sm:gap-4">
  {currentProducts.map((product) => (
    <div 
  key={product.id} 
  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
  onClick={() => router.push(`/loja/produto/${product.id}`)}
>
      <div className="relative h-32 sm:h-40 bg-gray-100 overflow-hidden">
        <img 
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.jpg'
          }}
        />
        {product.stock < 5 && product.stock > 0 && (
          <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
            Ultimas
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-2 sm:p-4">
        <h3 className="font-bold text-gray-900 text-sm sm:text-lg mb-0.5 sm:mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <span className="text-sm sm:text-xl font-bold text-[#FFB800]">{formatPrice(product.price)}</span>
          <button
            id={`btn-${product.id}`}
            onClick={() => adicionarAoCarrinho(product)}
            disabled={product.stock === 0}
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-base ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#FFB800] text-black hover:bg-[#E5A600]'
            }`}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => paginar(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginar(page)}
                  className={`px-3 py-1 rounded-lg transition ${
                    currentPage === page
                      ? 'bg-[#FFB800] text-black'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => paginar(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                →
              </button>
            </div>
          )}

          {/* Mensagem quando nao ha produtos */}
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}

        </div>

<div className="mt-8 space-y-4">
  <Link
    href="/dashboard"
    className="block text-center bg-gray-300 text-gray-700 px-4 rounded-lg font-semibold hover:bg-gray-200 transition h-9 flex items-center justify-center"
  >
    Voltar ao Início
  </Link>

  <div>
    <BotaoIndicarAmigo />
  </div>
</div>

</div>
</div>
)
}
