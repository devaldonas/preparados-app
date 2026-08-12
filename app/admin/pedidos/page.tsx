'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

interface Order {
  id: number
  user_id: string
  total_amount: number
  payment_status: string
  status: string
  created_at: string
  shipping_address: any
}

function AdminPedidosContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      const { data, error } = await (supabase
        .from('orders') as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as Order[]) || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (orderId: number, novoStatus: string) => {
    try {
      const { error } = await (supabase
        .from('orders') as any)
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      await carregarPedidos()
      alert('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'paid': return 'Pago'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando'
      case 'paid': return 'Pago'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  const filtrarPedidos = () => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.id.toString().includes(searchTerm) ||
      order.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const pedidosFiltrados = filtrarPedidos()

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
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Pedidos</h1>
            <p className="text-gray-500 text-sm">Acompanhe e gerencie todos os pedidos</p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar pedidos por ID ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
          />
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Pedido</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Usuário</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Pagamento</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Data</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium">#{order.id}</td>
                      <td className="p-3 text-gray-600 truncate max-w-[150px]">
                        {order.user_id ? (
                          <span className="font-mono text-xs">{order.user_id.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-gray-400">Não informado</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getPaymentStatusText(order.payment_status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => atualizarStatus(order.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status || 'pending')}`}
                        >
                          <option value="pending">Pendente</option>
                          <option value="paid">Pago</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPedidos() {
  return (
    <AdminGuard>
      <AdminPedidosContent />
    </AdminGuard>
  )
}