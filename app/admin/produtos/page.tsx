'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    console.log('1. useEffect executado')
    verificarAdmin()
  }, [])

  const verificarAdmin = async () => {
    console.log('2. Verificando admin...')
    
    const { data: { user } } = await supabase.auth.getUser()
    console.log('3. Usuario:', user?.email)
    
    if (!user) {
      console.log('4. Sem usuario, redirecionando...')
      router.push('/dashboard')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('5. Profile:', profile)
    console.log('6. Error:', error)

    if (profile?.role !== 'admin') {
      console.log('7. Nao é admin, redirecionando...')
      router.push('/dashboard')
      return
    }

    console.log('8. É admin! Carregando produtos...')
    setIsAdmin(true)
    await carregarProdutos()
  }

  const carregarProdutos = async () => {
    console.log('9. Carregando produtos...')
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')

    console.log('10. Produtos carregados:', data?.length)
    setProducts(data || [])
    setLoading(false)
  }

  const toggleProdutoStatus = async (id: number, currentStatus: boolean) => {
    console.log('Alternando status do produto:', id)
    await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    await carregarProdutos()
  }

  if (loading) {
    console.log('11. Loading true, mostrando spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (!isAdmin) {
    console.log('12. isAdmin false, retornando null')
    return null
  }

  console.log('13. Renderizando pagina admin')
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Administração - Produtos</h1>
          <Link
            href="/admin/produtos/novo"
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            + Novo Produto
          </Link>
        </div>

        <Link
  href="/admin/estoque"
  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
>
  Gerenciar Estoque
</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[600px]">
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
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleProdutoStatus(product.id, product.is_active)}
                        className={`text-sm ${
                          product.is_active 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        } hover:underline`}
                      >
                        {product.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum produto cadastrado ainda.
          </div>
        )}
      </div>

      <div className="mt-8">
                  <Link href="/dashboard" className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition">
                    Voltar ao Início
                  </Link>
                
              </div>

    </div>
  )
}