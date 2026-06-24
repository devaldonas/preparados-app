// app/loja/pedidos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, Clock, CheckCircle, Truck, AlertCircle, Eye } from 'lucide-react'

interface Order {
  id: number
  user_id: string
  total_amount: number
  payment_method: string
  payment_status: string
  transaction_id: string
  status: string
  shipping_address: string
  created_at: string
  items?: any[]
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    carregarUsuario()
  }, [])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    await carregarPedidos(user.id)
  }

  const carregarPedidos = async (userId: string) => {
    try {
      // Buscar pedidos do usuário
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Buscar itens de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
          
          return { ...order, items: items || [] }
        })
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Aguardando pagamento', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      paid: { label: 'Pago', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
      processing: { label: 'Processando', icon: Package, color: 'text-purple-600 bg-purple-50' },
      shipped: { label: 'Enviado', icon: Truck, color: 'text-orange-600 bg-orange-50' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    }
    return map[status] || map.pending
  }

  const getPaymentStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Aguardando',
      paid: 'Pago',
      failed: 'Falhou',
      refunded: 'Reembolsado'
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              📦 Meus Pedidos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhe todos os seus pedidos
            </p>
          </div>
          <Link
            href="/loja"
            className="text-sm text-[#FFB800] hover:underline flex items-center gap-1"
          >
            ← Continuar comprando
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Você ainda não fez nenhuma compra na loja.
            </p>
            <Link
              href="/loja"
              className="inline-block bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon
              const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
              
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold text-gray-900">
                          Pedido #{order.transaction_id?.slice(-8) || order.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold ${statusInfo.color}`}>
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </div>
                        <span className={`text-[0.55rem] px-2 py-0.5 rounded-full ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                      </div>
                    </div>

                    {/* Resumo dos itens */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-gray-600">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                        <span className="mx-2">·</span>
                        <span className="font-display font-bold text-[#FFB800]">
                          {formatPrice(order.total_amount)}
                        </span>
                        <span className="mx-2">·</span>
                        <span className="text-xs text-gray-400">
                          {order.payment_method?.toUpperCase() || 'PIX'}
                        </span>
                      </div>

                      <Link href={`/loja/pedidos/${order.id}`}>
                        <button className="flex items-center gap-1 text-sm text-[#FFB800] hover:text-[#E5A600] transition font-medium">
                          Ver detalhes
                          <ChevronRight size={16} />
                        </button>
                      </Link>
                    </div>

                    {/* Mini preview dos itens */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-gray-600">{item.quantity}x</span>
                            <span className="text-xs text-gray-800">{item.name || `Produto ${item.product_id}`}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex-shrink-0 flex items-center bg-gray-50 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-gray-500">+{order.items.length - 3} itens</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}