// app/admin/expedicao/page.tsx (CORRIGIDO - COM RPC)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { Package, Truck, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

interface Order {
  id: number
  user_id: string
  total_amount: number
  payment_method: string
  payment_status: string
  shipping_status: string
  created_at: string
  user_name?: string
  user_email?: string
}

export default function AdminExpedicao() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      // 1. Buscar pedidos pagos
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true })

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

      // 2. Buscar usuários com email via RPC
      const ordersWithUsers = await Promise.all(
        ordersData.map(async (order) => {
          let userName = 'Cliente'
          let userEmail = 'Sem email'

          if (order.user_id) {
            try {
              // Buscar dados do perfil
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', order.user_id)
                .maybeSingle()

              if (!userError && userData) {
                userName = userData.full_name || 'Cliente'
              }

              // Buscar email via RPC
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

      setOrders(ordersWithUsers)
    } catch (error) {
      console.error('Erro:', error)
      setErrorMessage('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (orderId: number, status: string) => {
    setUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_status: status })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, shipping_status: status }
          : order
      ))

      setSuccessMessage('Status atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setErrorMessage('Erro ao atualizar status')
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
      pending: { label: 'Aguardando', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      label_generated: { label: 'Etiqueta Gerada', icon: Package, color: 'text-blue-600 bg-blue-50' },
      posted: { label: 'Postado', icon: Truck, color: 'text-purple-600 bg-purple-50' },
      in_transit: { label: 'Em Trânsito', icon: Truck, color: 'text-orange-600 bg-orange-50' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    }
    return map[status] || map.pending
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> Central de Expedição</h1>
            <p className="text-gray-500 text-sm">Gerencie os pedidos pagos e aguardando envio</p>
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
            <CheckCircle size={18} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum pedido aguardando expedição</p>
              <p className="text-sm text-gray-400">Os pedidos pagos aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const statusInfo = getStatusInfo(order.shipping_status || 'pending')
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-900">
                            #{order.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {order.user_name || 'Cliente'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.user_email || 'Sem email'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display font-bold text-[#FFB800]">
                            {formatPrice(order.total_amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => atualizarStatus(order.id, 'label_generated')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                            >
                              Etiqueta
                            </button>
                            <button
                              onClick={() => atualizarStatus(order.id, 'posted')}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                            >
                              Postar
                            </button>
                            <button
                              onClick={() => atualizarStatus(order.id, 'in_transit')}
                              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
                            >
                              Trânsito
                            </button>
                            <button
                              onClick={() => atualizarStatus(order.id, 'delivered')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                            >
                              Entregar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {orders.length} pedidos para expedir
        </div>
      </div>
    </div>
  )
}