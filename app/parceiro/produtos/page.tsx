'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Package, DollarSign, Truck } from 'lucide-react'

export default function ParceiroProdutos() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await (supabase
          .from('products') as any)
          .select('*')
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProdutos(data || [])
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarProdutos()
  }, [])

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black">Meus Produtos</h1>
          <Link
            href="/parceiro/produtos/novo"
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Produto
          </Link>
        </div>

        {produtos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Nenhum produto cadastrado</h3>
            <p className="text-sm text-gray-500">Comece cadastrando seu primeiro produto</p>
            <Link
              href="/parceiro/produtos/novo"
              className="mt-4 inline-block bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
            >
              Cadastrar Produto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {produto.image_url && (
                  <img
                    src={produto.image_url}
                    alt={produto.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-black">{produto.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{produto.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[#FFB800]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Estoque: {produto.stock}
                    </span>
                  </div>
                  <Link
                    href={`/parceiro/produtos/${produto.id}`}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    <Edit size={16} />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
