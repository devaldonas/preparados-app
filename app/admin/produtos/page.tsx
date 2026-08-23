'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { Plus, Package, Search, Edit, Eye, Trash2 } from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image_url: string
  is_active: boolean
  partner_id: string
  created_at: string
}

function AdminProdutosContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const produtosFiltrados = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Produtos</h1>
            <p className="text-gray-500 text-sm">Gerencie todos os produtos da loja</p>
          </div>
          <Link
            href="/admin/produtos/novo"
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Produto
          </Link>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produtos por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
            />
          </div>
        </div>

        {/* Lista de Produtos */}
        {produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum produto encontrado com esta busca' : 'Nenhum produto cadastrado ainda'}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/produtos/novo"
                className="text-[#FFB800] hover:underline mt-2 block"
              >
                Criar primeiro produto
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Produto</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Categoria</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Preço</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Estoque</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-black">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{product.category || '-'}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{formatarMoeda(product.price)}</td>
                      <td className="p-4">
                        <span className={`text-sm ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} unidades` : 'Esgotado'}
                        </span>
                      </td>
                      <td className="p-4">
                        {product.is_active ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Ativo</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">Inativo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {/* 🔥 LINK CORRIGIDO - ADMIN */}
                          <Link
                            href={`/admin/produtos/${product.id}`}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/produtos/${product.id}/editar`}
                            className="p-2 bg-[#FFB800]/10 text-[#FFB800] rounded-lg hover:bg-[#FFB800]/20 transition"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja excluir este produto?')) {
                                const { error } = await supabase
                                  .from('products')
                                  .delete()
                                  .eq('id', product.id)
                                
                                if (error) {
                                  alert('Erro ao excluir produto')
                                } else {
                                  await carregarProdutos()
                                }
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
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

export default function AdminProdutos() {
  return (
    <AdminGuard>
      <AdminProdutosContent />
    </AdminGuard>
  )
}
