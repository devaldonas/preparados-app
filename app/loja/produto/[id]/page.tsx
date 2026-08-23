'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, DollarSign, Calendar, ShoppingCart, Truck } from 'lucide-react'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image_url: string
  images: string[]
  is_active: boolean
  free_shipping: boolean
  partner_id: string
  created_at: string
  updated_at: string
}

interface Partner {
  id: string
  company_name: string
}

export default function ProdutoDetalhes({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { id } = await params
        const productId = parseInt(id)

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productError) throw productError
        setProduct(productData)
        
        if (productData?.image_url) {
          setSelectedImage(productData.image_url)
        } else if (productData?.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0])
        }

        if (productData?.partner_id) {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('id, company_name')
            .eq('id', productData.partner_id)
            .maybeSingle()
          setPartner(partnerData)
        }

      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        router.push('/loja')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [params, router])

  const adicionarAoCarrinho = async () => {
    if (!product) return

    try {
      setAddingToCart(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle()

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
      } else {
        await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1
          })
      }

      alert('Produto adicionado ao carrinho!')
      router.push('/loja/carrinho')
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      alert('Erro ao adicionar produto ao carrinho')
    } finally {
      setAddingToCart(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const todasImagens: string[] = []
  if (product?.image_url && product.image_url.trim() !== '') {
    todasImagens.push(product.image_url)
  }
  if (product?.images && product.images.length > 0) {
    product.images.forEach((img: string) => {
      if (img && img.trim() !== '' && !todasImagens.includes(img)) {
        todasImagens.push(img)
      }
    })
  }

  if (todasImagens.length === 0) {
    todasImagens.push('/images/placeholder.jpg')
  }

  if (!selectedImage || !todasImagens.includes(selectedImage)) {
    setSelectedImage(todasImagens[0])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Produto não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="mb-6">
          <Link
            href="/loja"
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            <ArrowLeft size={18} />
            Voltar para Loja
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">{product.name}</h1>
            <p className="text-sm text-gray-500">Detalhes do produto</p>
          </div>
          <button
            onClick={adicionarAoCarrinho}
            disabled={addingToCart || product.stock <= 0}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              product.stock > 0
                ? 'bg-[#FFB800] text-black hover:bg-[#E5A600]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            {product.stock > 0 ? `Comprar - ${formatarMoeda(product.price)}` : 'Esgotado'}
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
            <img
              src={selectedImage || todasImagens[0]}
              alt={product.name}
              className="w-full max-w-md mx-auto h-64 object-contain rounded-lg"
              onError={(e) => { 
                e.currentTarget.src = '/images/placeholder.jpg'
              }}
            />
          </div>
          
          {todasImagens.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
              {todasImagens.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition ${
                    selectedImage === img 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-[#FFB800]" />
              Informações do Produto
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="font-medium">{product.description || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="font-medium">{product.category}</p>
              </div>
              {partner && (
                <div>
                  <p className="text-sm text-gray-500">Vendido por</p>
                  <p className="font-medium">{partner.company_name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-[#FFB800]" />
              Preço e Estoque
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Preço</p>
                <p className="font-medium text-[#FFB800]">{formatarMoeda(product.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estoque</p>
                <p className={`font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} unidades disponíveis` : 'Esgotado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frete</p>
                <p className="font-medium">
                  {product.free_shipping ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Truck size={16} />
                      Grátis
                    </span>
                  ) : (
                    <span className="text-gray-500">Calculado no checkout</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-[#FFB800]" />
              Datas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Adicionado em</p>
                <p className="font-medium">{formatarData(product.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="font-medium">{formatarData(product.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <BotaoIndicarAmigo />
        </div>

      </div>
    </div>
  )
}
