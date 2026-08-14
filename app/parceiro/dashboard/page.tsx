'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingBag, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'

export default function ParceiroDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pedidos: 0,
    produtos: 0,
    comissoes: 0,
    vendas: 0
  })
  const [pedidosRecentes, setPedidosRecentes] = useState([])
  const router = useRouter()

  useEffect(() => {
    const verificarParceiro = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'partner') {
        router.push('/dashboard')
        return
      }

      await carregarDados(user.id)
    }

    verificarParceiro()
  }, [])

  const carregarDados = async (userId: string) => {
    try {
      // Buscar produtos do parceiro
      const { data: produtos } = await (supabase
        .from('products') as any)
        .select('id, name, stock, price')
        .eq('partner_id', userId)

      // Buscar pedidos (mock - depois implementar com join)
      setStats({
        pedidos: 0,
        produtos: produtos?.length || 0,
        comissoes: 0,
        vendas: 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-black mb-6">Dashboard Parceiro</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-2xl font-bold text-black">{stats.pedidos}</p>
              </div>
              <div className="w-10 h-10 bg-[#FFB800]/10 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-[#FFB800]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <p className="text-2xl font-bold text-black">{stats.produtos}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Comissões</p>
                <p className="text-2xl font-bold text-black">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.comissoes)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendas (mês)</p>
                <p className="text-2xl font-bold text-black">{stats.vendas}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Links rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/parceiro/pedidos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Package size={20} className="text-[#FFB800]" />
              <span className="font-medium text-black">Expedição</span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>

          <Link
            href="/parceiro/produtos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-blue-500" />
              <span className="font-medium text-black">Meus Produtos</span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>

          <Link
            href="/parceiro/comissoes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-green-500" />
              <span className="font-medium text-black">Comissões</span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}
