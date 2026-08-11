'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  Clock,
  Video,
  BarChart3,
  ClipboardList,
  Store,
  Home
} from 'lucide-react'

interface Order {
  id: number
  payment_status: string
  total_amount: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    revenue: 0,
    pendingPartners: 0
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

        const { data: profile } = await supabase
          .from('profiles')
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
      const { count: productCount } = await (supabase
        .from('products') as any)
        .select('*', { count: 'exact', head: true })

      // Pedidos
      const { data: orders, count: orderCount } = await (supabase
        .from('orders') as any)
        .select('*', { count: 'exact' })

      const ordersData = (orders as Order[]) || []
      const pendingOrders = ordersData.filter(o => o.payment_status === 'pending').length || 0
      
      const revenue = ordersData
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)

      // Usuários
      const { count: userCount } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })

      // Parceiros pendentes
      const { count: pendingPartners } = await (supabase
        .from('partners') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        pendingOrders: pendingOrders,
        totalUsers: userCount || 0,
        revenue: revenue,
        pendingPartners: pendingPartners || 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm">Gerencie todos os aspectos da sua loja</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Produtos</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
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
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pendentes</p>
                <p className="font-display text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Faturamento</p>
                <p className="font-display text-lg font-bold text-green-600">{formatPrice(stats.revenue)}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Acesso Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/produtos">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Package size={24} className="text-blue-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Produtos</h3>
              <p className="text-sm text-gray-500">Gerenciar produtos da loja</p>
            </div>
          </Link>

          <Link href="/admin/pedidos">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <ClipboardList size={24} className="text-purple-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Pedidos</h3>
              <p className="text-sm text-gray-500">Acompanhar e gerenciar pedidos</p>
              {stats.pendingOrders > 0 && (
                <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                  {stats.pendingOrders} pendentes
                </span>
              )}
            </div>
          </Link>

          <Link href="/admin/parceiros">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                <Store size={24} className="text-indigo-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Parceiros</h3>
              <p className="text-sm text-gray-500">Gerenciar parceiros vendedores</p>
              {stats.pendingPartners > 0 && (
                <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                  {stats.pendingPartners} pendentes
                </span>
              )}
            </div>
          </Link>

          <Link href="/admin/usuarios">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Users size={24} className="text-green-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Usuários</h3>
              <p className="text-sm text-gray-500">Gerenciar usuários do app</p>
            </div>
          </Link>

          <Link href="/admin/expedicao">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mb-3">
                <Truck size={24} className="text-teal-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Expedição</h3>
              <p className="text-sm text-gray-500">Gerenciar envios</p>
            </div>
          </Link>

          <Link href="/admin/mentoria">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-[#FFB800]/10 rounded-lg flex items-center justify-center mb-3">
                <Video size={24} className="text-[#FFB800]" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Mentoria</h3>
              <p className="text-sm text-gray-500">Gerenciar lives e notificações</p>
            </div>
          </Link>

          <Link href="/admin/relatorios">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 size={24} className="text-orange-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Relatórios</h3>
              <p className="text-sm text-gray-500">Análises e estatísticas</p>
            </div>
          </Link>
        </div>

        {/* Botão Voltar ao Início */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
          >
            <Home size={18} />
            Entrar no App
          </Link>
        </div>

      </div>
    </div>
  )
}