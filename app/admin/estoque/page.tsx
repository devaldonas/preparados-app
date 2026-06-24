'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import AdminGuard from '@/components/AdminGuard'

interface Product {
  id: number
  name: string
  stock: number
  price: number
  category: string
  is_active: boolean
}

function AdminEstoqueContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newStock, setNewStock] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')

    setProducts(data || [])
    setLoading(false)
  }

  const atualizarEstoque = async (id: number, novoEstoque: number) => {
    if (novoEstoque < 0) {
      alert('O estoque não pode ser negativo')
      return
    }

    const { error } = await supabase
      .from('products')
      .update({ 
        stock: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar estoque:', error)
      alert('Erro ao atualizar estoque')
    } else {
      await carregarProdutos()
      setEditingId(null)
      alert('Estoque atualizado com sucesso!')
    }
  }

  const filtrarProdutos = () => {
    if (!searchTerm) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const produtosFiltrados = filtrarProdutos()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/admin/produtos" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Gestão de Estoque</h1>
          <Link
            href="/admin/produtos"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
          />
        </div>

        {/* Lista de produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-left p-3">Preço</th>
                  <th className="text-left p-3">Estoque</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3 text-gray-600">{product.category}</td>
                    <td className="p-3 text-gray-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </td>
                    <td className="p-3">
                      {editingId === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            min="0"
                          />
                          <button
                            onClick={() => atualizarEstoque(product.id, newStock)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${
                            product.stock === 0 ? 'text-red-600' :
                            product.stock < 5 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {product.stock}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(product.id)
                              setNewStock(product.stock)
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/estoque/historico/${product.id}`}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Histórico
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {produtosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminEstoque() {
  return (
    <AdminGuard>
      <AdminEstoqueContent />
    </AdminGuard>
  )
}