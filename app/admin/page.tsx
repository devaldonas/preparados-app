// app/admin/page.tsx (ATUALIZADO COM TODOS OS BOTÕES)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import {
  Package,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  Clock,
  BarChart3,
  Settings,
  ClipboardList
} from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    revenue: 0
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      const { data: orders, count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })

      const pendingOrders = orders?.filter(o => o.payment_status === 'pending').length || 0
      
      const revenue = orders
        ?.filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0) || 0

      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        pendingOrders: pendingOrders,
        totalUsers: userCount || 0,
        revenue: revenue
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
      <NavBar showBackButton={true} backButtonPath="/dashboard" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900"> Painel Administrativo</h1>
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
          {/* Produtos */}
          <Link href="/admin/produtos">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Package size={24} className="text-blue-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Produtos</h3>
              <p className="text-sm text-gray-500">Gerenciar produtos da loja</p>
            </div>
          </Link>

          {/* Pedidos */}
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

          {/* Usuários */}
          <Link href="/admin/usuarios">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Users size={24} className="text-green-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Usuários</h3>
              <p className="text-sm text-gray-500">Gerenciar usuários do app</p>
            </div>
          </Link>

          {/* Expedição */}
          <Link href="/admin/expedicao">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mb-3">
                <Truck size={24} className="text-teal-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Expedição</h3>
              <p className="text-sm text-gray-500">Gerenciar envios</p>
            </div>
          </Link>

          {/* Relatórios 
          <Link href="/admin/relatorios">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 size={24} className="text-orange-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Relatórios</h3>
              <p className="text-sm text-gray-500">Análises e estatísticas</p>
            </div>
          </Link> */}

          {/* Configurações 
          <Link href="/admin/configuracoes">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800]">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                <Settings size={24} className="text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Configurações</h3>
              <p className="text-sm text-gray-500">Configurações da loja</p>
            </div>
          </Link> */}
        </div>
      </div>
    </div>
  )
}