'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { BarChart3, ShoppingBag, Users, TrendingUp, Package, DollarSign } from 'lucide-react'

export default function AdminRelatorios() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // 🔥 CORRIGIDO: usando as any para evitar erro de tipo
        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        if ((profile as any)?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        await carregarDados()
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/dashboard')
      }
    }

    checkAdmin()
  }, [])

  const carregarDados = async () => {
    try {
      // Produtos
      const { count: totalProducts } = await (supabase
        .from('products') as any)
        .select('*', { count: 'exact', head: true })

      // Pedidos
      const { data: orders } = await (supabase
        .from('orders') as any)
        .select('*')

      const ordersData = (orders as any[]) || []
      const totalOrders = ordersData.length
      const pendingOrders = ordersData.filter((o: any) => o.payment_status === 'pending').length || 0
      const totalRevenue = ordersData
        .filter((o: any) => o.payment_status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)

      // Usuários
      const { count: totalUsers } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })

      setStats({
        totalProducts: totalProducts || 0,
        totalOrders,
        totalUsers: totalUsers || 0,
        totalRevenue,
        pendingOrders,
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Relatórios</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <p className="text-2xl font-bold text-black">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-2xl font-bold text-black">{stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (
                  <p className="text-xs text-orange-500">{stats.pendingOrders} pendentes</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuários</p>
                <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Faturamento</p>
                <p className="text-2xl font-bold text-black">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}