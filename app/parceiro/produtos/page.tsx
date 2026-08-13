// app/parceiro/produtos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { Package, Plus, Edit, Trash2, Eye, Check, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock: number
  is_active: boolean
  created_at: string
}

export default function PartnerProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // 🔥 CORRIGIDO: buscar parceiro com as any
      const { data: partnerData, error: partnerError } = await (supabase
        .from('partners') as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (partnerError || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)

      // 🔥 CORRIGIDO: buscar produtos com as any
      const { data: productsData, error: productsError } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      setProducts(productsData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 CORRIGIDO: toggleStatus com as any
  const toggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from('products') as any)
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ))

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // 🔥 CORRIGIDO: excluirProduto com as any
  const excluirProduto = async (productId: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${productName}"?`)) return

    try {
      const { error } = await (supabase
        .from('products') as any)
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))

    } catch (error) {
      console.error('Erro ao excluir:', error)
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
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/parceiro/dashboard" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 Meus Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie seus produtos na loja</p>
          </div>
          <Link
            href="/parceiro/produtos/novo"
            className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Produto
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Você ainda não tem produtos</p>
            <Link
              href="/parceiro/produtos/novo"
              className="inline-block bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-6 py-2 rounded-lg transition"
            >
              Criar meu primeiro produto
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={product.image_url || '/images/placeholder.jpg'}
                              alt={product.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-display font-bold text-[#FFB800]">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          product.stock === 0 ? 'text-red-500' :
                          product.stock < 5 ? 'text-orange-500' :
                          'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(product.id, product.is_active)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                            product.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(product.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/parceiro/produtos/editar/${product.id}`}>
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                              <Edit size={16} />
                            </button>
                          </Link>
                          <Link href={`/loja/produto/${product.id}`} target="_blank">
                            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Visualizar">
                              <Eye size={16} />
                            </button>
                          </Link>
                          <button
                            onClick={() => excluirProduto(product.id, product.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}