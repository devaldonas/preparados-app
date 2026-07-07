// app/admin/relatorios/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, BarChart3, Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'

export default function AdminRelatorios() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    verificarAdmin()
    carregarEstatisticas()
  }, [])

  const verificarAdmin = async () => {
    try {
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
    } catch (error) {
      console.error('Erro ao verificar admin:', error)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      // Total de usuários
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Total de pedidos
      const { data: orders, count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })

      const pendingOrders = orders?.filter(o => o.status === 'pending' || o.payment_status === 'pending').length || 0
      const totalRevenue = orders?.filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0) || 0

      setStats({
        totalUsers: userCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
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
      
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            
            <h1 className="text-2xl font-bold text-gray-900"> Relatórios</h1>
            <p className="text-sm text-gray-500">Visão geral do desempenho da loja</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Usuários</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pedidos</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Faturamento</p>
                <p className="font-display text-xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pendentes</p>
                <p className="font-display text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Resumo</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• {stats.totalUsers} usuários cadastrados</p>
            <p>• {stats.totalOrders} pedidos realizados</p>
            <p>• {formatPrice(stats.totalRevenue)} em faturamento total</p>
            <p>• {stats.pendingOrders} pedidos aguardando processamento</p>
          </div>
        </div>
      </div>
    </div>
  )
}