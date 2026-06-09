'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'

interface Product {
  id: number
  name: string
  price: number
  category: string
  stock: number
  is_active: boolean
}

export default function AdminProdutos() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    verificarAdmin()
  }, [])

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    carregarProdutos()
  }

  const carregarProdutos = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')

    setProducts(data || [])
    setLoading(false)
  }

  const toggleProdutoStatus = async (id: number, currentStatus: boolean) => {
    await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    await carregarProdutos()
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/dashboard" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Administracao - Produtos</h1>
          <Link
            href="/admin/produtos/novo"
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            + Novo Produto
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">Categoria</th>
                <th className="text-left p-3">Preco</th>
                <th className="text-left p-3">Estoque</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.category}</td>
                  <td className="p-3">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </td>
                  <td className="p-3">{product.stock}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleProdutoStatus(product.id, product.is_active)}
                      className="text-sm text-[#FFB800] hover:underline"
                    >
                      {product.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}