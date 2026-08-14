'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, Search, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Pedido {
  id: number
  user_id: string
  total_amount: number
  payment_status: string
  status: string
  created_at: string
  shipping_address: any
  items: any[]
}

export default function ParceiroPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const verificarParceiro = async () => {
      try {
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

        await carregarPedidos(user.id)
      } catch (error) {
        console.error('Erro ao verificar parceiro:', error)
        router.push('/dashboard')
      }
    }

    verificarParceiro()
  }, [])

  const carregarPedidos = async (userId: string) => {
    try {
      console.log('🔍 Buscando pedidos...')
      
      // 🔥 Buscar o parceiro
      const { data: partner } = await (supabase
        .from('partners') as any)
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!partner) {
        console.log('❌ Parceiro não encontrado')
        setPedidos([])
        setLoading(false)
        return
      }

      console.log('✅ Parceiro ID:', partner.id)

      // 🔥 Buscar produtos do parceiro
      const { data: produtos } = await (supabase
        .from('products') as any)
        .select('id')
        .eq('partner_id', partner.id)

      const productIds = produtos?.map((p: any) => p.id) || []
      console.log('📦 Produtos do parceiro:', productIds)

      if (productIds.length === 0) {
        setPedidos([])
        setLoading(false)
        return
      }

      // 🔥 Buscar pedidos diretamente com Supabase (sem API route)
      const { data: pedidosData, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error)
        setPedidos([])
      } else {
        console.log('📊 Total de pedidos recebidos:', pedidosData?.length || 0)
        
        // 🔥 Filtrar pedidos que contêm produtos do parceiro
        const pedidosFiltrados = pedidosData?.filter((pedido: any) => {
          const hasProduct = pedido.items?.some((item: any) => 
            productIds.includes(item.product_id)
          )
          return hasProduct
        }) || []

        console.log('📦 Pedidos do parceiro encontrados:', pedidosFiltrados.length)
        setPedidos(pedidosFiltrados)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error)
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (pedido: Pedido) => {
    const status = pedido.status || 'pending'
    
    const configs: Record<string, { label: string, icon: any, color: string }> = {
      'pending': { label: 'Pendente', icon: Clock, color: 'bg-gray-100 text-gray-600' },
      'paid': { label: 'Pago', icon: CheckCircle, color: 'bg-yellow-100 text-yellow-700' },
      'shipped': { label: 'Enviado', icon: Truck, color: 'bg-blue-100 text-blue-700' },
      'delivered': { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      'cancelled': { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-700' }
    }
    return configs[status] || configs['pending']
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    const status = pedido.status || 'pending'
    if (filter !== 'todos' && status !== filter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return pedido.id.toString().includes(searchLower)
    }
    return true
  })

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
          <h1 className="text-2xl font-bold text-black">Expedição</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] w-48"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              🔄 Recarregar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['todos', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => {
            const config = getStatusConfig({ status } as Pedido)
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  filter === status
                    ? 'bg-[#FFB800] text-black font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'todos' ? 'Todos' : config.label}
              </button>
            )
          })}
        </div>

        {/* 🔥 Contador de pedidos por status */}
        <div className="text-sm text-gray-500 mb-4">
          Total: {pedidos.length} pedidos 
          ({pedidos.filter(p => p.status === 'pending').length} pendentes, 
          {pedidos.filter(p => p.status === 'paid').length} pagos, 
          {pedidos.filter(p => p.status === 'shipped').length} enviados)
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Nenhum pedido encontrado</h3>
            <p className="text-sm text-gray-500">
              {search ? 'Tente buscar por outro termo' : 'Os pedidos dos seus produtos aparecerão aqui'}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              <p>Debug: {pedidos.length} pedidos encontrados</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => {
              const statusConfig = getStatusConfig(pedido)
              const StatusIcon = statusConfig.icon
              
              return (
                <Link
                  key={pedido.id}
                  href={`/parceiro/pedidos/${pedido.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-black">Pedido #{pedido.id}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm font-medium text-[#FFB800] mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total_amount)}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
