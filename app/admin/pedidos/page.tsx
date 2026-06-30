// app/admin/pedidos/page.tsx (CORRIGIDO - SEM ERROS DE SINTAXE)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { formatDate } from '@/lib/utils'
import {
  Search,
  Eye,
  Check,
  X,
  AlertCircle,
  Package,
  Truck,
  Clock,
  DollarSign,
  RefreshCw,
  Ban,
  CheckCircle
} from 'lucide-react'

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
  updated_at: string
  items?: OrderItem[]
  user_name?: string
  user_email?: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: string
  quantity: number
  price: number
  product?: {
    name: string
    image_url: string
  }
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPayment, setFilterPayment] = useState('todos')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar pedidos:', error)
        setErrorMessage('Erro ao carregar pedidos: ' + error.message)
        setLoading(false)
        return
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const ordersWithUsers = await Promise.all(
        ordersData.map(async (order) => {
          let userName = 'Cliente'
          let userEmail = 'Sem email'

          if (order.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', order.user_id)
                .maybeSingle()

              if (!userError && userData) {
                userName = userData.full_name || 'Cliente'
              }

              const { data: emailData, error: emailError } = await supabase
                .rpc('get_user_email', { user_id: order.user_id })

              if (!emailError && emailData) {
                userEmail = emailData
              }

            } catch (err) {
              console.error('Erro ao buscar usuário:', err)
            }
          }

          return {
            ...order,
            user_name: userName,
            user_email: userEmail
          }
        })
      )

      const ordersWithItems = await Promise.all(
        ordersWithUsers.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select(`
              *,
              products:product_id (
                name,
                image_url
              )
            `)
            .eq('order_id', order.id)

          return {
            ...order,
            items: items || []
          }
        })
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Erro:', error)
      setErrorMessage('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string, paymentStatus?: string) => {
    setUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const updateData: any = { status }
      if (paymentStatus) {
        updateData.payment_status = paymentStatus
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, ...updateData }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updateData })
      }

      setSuccessMessage('Pedido atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      setErrorMessage('Erro ao atualizar pedido')
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }
  
  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      paid: { label: 'Pago', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
      processing: { label: 'Processando', icon: Package, color: 'text-purple-600 bg-purple-50' },
      shipped: { label: 'Enviado', icon: Truck, color: 'text-orange-600 bg-orange-50' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      cancelled: { label: 'Cancelado', icon: Ban, color: 'text-red-600 bg-red-50' },
    }
    return map[status] || map.pending
  }

  const getPaymentStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'Aguardando', color: 'text-yellow-600' },
      paid: { label: 'Pago', color: 'text-green-600' },
      failed: { label: 'Falhou', color: 'text-red-600' },
      refunded: { label: 'Reembolsado', color: 'text-gray-600' }
    }
    return map[status] || map.pending
  }

  const filteredOrders = orders.filter(order => {
    const matchSearch =
      (order.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (order.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    const matchStatus = filterStatus === 'todos' || order.status === filterStatus
    const matchPayment = filterPayment === 'todos' || order.payment_status === filterPayment
    
    return matchSearch && matchStatus && matchPayment
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    toShip: orders.filter(o => o.status === 'paid' || o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length,
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
      <NavBar showBackButton={true} backButtonPath="/admin" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> Gerenciar Pedidos</h1>
            <p className="text-gray-500 text-sm">Acompanhe e gerencie todos os pedidos da loja</p>
          </div>
          <button
            onClick={carregarPedidos}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Total</p>
            <p className="font-display text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Aguardando Pag.</p>
            <p className="font-display text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Para Expedir</p>
            <p className="font-display text-2xl font-bold text-orange-600">{stats.toShip}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Enviados</p>
            <p className="font-display text-2xl font-bold text-green-600">{stats.shipped}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por pedido, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="processing">Processando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todos pagamentos</option>
              <option value="pending">Aguardando</option>
              <option value="paid">Pago</option>
              <option value="failed">Falhou</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Pagamento</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status)
                    const StatusIcon = statusInfo.icon
                    const paymentInfo = getPaymentStatusInfo(order.payment_status)
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-900">
                            #{order.transaction_id?.slice(-8) || order.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.user_name || 'Cliente'}</p>
                            <p className="text-xs text-gray-500">{order.user_email || 'Sem email'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display font-bold text-[#FFB800]">{formatPrice(order.total_amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`text-xs font-medium ${paymentInfo.color}`}>{paymentInfo.label}</span>
                            <span className="block text-[0.55rem] text-gray-400 uppercase">{order.payment_method || 'PIX'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowOrderModal(true)
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {filteredOrders.length} pedidos
          {searchTerm && ` (filtrados de ${orders.length})`}
        </div>
      </div>

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pedido #{selectedOrder.transaction_id?.slice(-8) || selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false)
                    setSelectedOrder(null)
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-2">Cliente</h3>
                  <p className="text-gray-700">{selectedOrder.user_name || 'Cliente'}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.user_email || 'Sem email'}</p>
                </div>

                <div>
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={item.product?.image_url || '/images/placeholder.jpg'}
                              alt={item.product?.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product?.name || `Produto ${item.product_id}`}</p>
                            <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.price)}</p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-sm text-[#FFB800]">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="text-gray-900">Grátis</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-[#FFB800]">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Atualizar Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Pendente
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'paid', 'paid')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'paid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Pago
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'processing' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Processando
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'shipped' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Enviado
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Entregue
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-2">Informações de Pagamento</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Método</p>
                      <p className="text-gray-900 font-medium uppercase">{selectedOrder.payment_method || 'PIX'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className={`font-medium ${getPaymentStatusInfo(selectedOrder.payment_status).color}`}>
                        {getPaymentStatusInfo(selectedOrder.payment_status).label}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Transação</p>
                      <p className="text-gray-900 font-mono text-xs">{selectedOrder.transaction_id}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.shipping_address && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-2">Endereço de Entrega</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedOrder.shipping_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}