'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Truck, Check, X, Loader2, RefreshCw } from 'lucide-react'

interface Order {
  id: number
  user_id: string
  total_amount: number
  subtotal: number
  shipping_cost: number
  discount_amount: number
  payment_method: string
  payment_status: string
  status: string
  transaction_id: string
  shipping_address: any
  created_at: string
  email: string
  customer_name: string
}

export default function AdminPedidoDetalhes() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [estornando, setEstornando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarPedido()
  }, [])

  const carregarPedido = async () => {
    try {
      const orderId = params.id as string
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name, image_url)')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      // Parse shipping_address se for string
      if (orderData.shipping_address && typeof orderData.shipping_address === 'string') {
        try {
          orderData.shipping_address = JSON.parse(orderData.shipping_address)
        } catch (e) {}
      }

      setOrder(orderData)
      setItems(itemsData || [])
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      setError('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (novoStatus: string) => {
    if (!order) return
    
    setUpdating(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) throw error

      // Se o status for 'cancelled', o trigger já estorna os créditos
      setOrder({ ...order, status: novoStatus })
      alert(`Pedido ${novoStatus === 'cancelled' ? 'cancelado' : 'atualizado'} com sucesso!`)
      
      if (novoStatus === 'cancelled' && order.discount_amount > 0) {
        alert(`💰 ${order.discount_amount} em créditos foram estornados para a carteira do usuário.`)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setError('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const estornarCredits = async () => {
    if (!order || order.discount_amount <= 0) {
      alert('Este pedido não possui créditos para estornar.')
      return
    }

    if (!confirm(`Deseja estornar R$ ${order.discount_amount} em créditos para o usuário?`)) return

    setEstornando(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('estornar_creditos', {
        p_usuario_id: order.user_id,
        p_valor: order.discount_amount,
        p_pedido_id: order.id,
        p_descricao: 'Estorno manual de créditos - Pedido #' + order.id
      })

      if (error) throw error

      alert(`✅ R$ ${order.discount_amount} em créditos estornados com sucesso!`)
      
      // Atualizar o pedido para zero desconto (já foi estornado)
      await supabase
        .from('orders')
        .update({ discount_amount: 0 })
        .eq('id', order.id)
      
      setOrder({ ...order, discount_amount: 0 })
    } catch (error) {
      console.error('Erro ao estornar créditos:', error)
      setError('Erro ao estornar créditos')
    } finally {
      setEstornando(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    }
    return labels[status as keyof typeof labels] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Pedido não encontrado'}</p>
        <Link href="/admin/pedidos" className="text-[#FFB800] hover:underline mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/pedidos"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black">Pedido #{order.id}</h1>
          <p className="text-sm text-gray-500">Gerencie os detalhes do pedido</p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Status atual</p>
            <span className={`inline-block mt-1 text-sm px-3 py-1 rounded-full ${getStatusBadge(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => atualizarStatus('paid')}
                  disabled={updating}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Marcar como Pago
                </button>
                <button
                  onClick={() => atualizarStatus('cancelled')}
                  disabled={updating}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                  Cancelar
                </button>
              </>
            )}
            {order.status === 'paid' && (
              <button
                onClick={() => atualizarStatus('shipped')}
                disabled={updating}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                {updating ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                Marcar como Enviado
              </button>
            )}
            {order.discount_amount > 0 && order.status !== 'cancelled' && (
              <button
                onClick={estornarCredits}
                disabled={estornando}
                className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E5A600] transition flex items-center gap-2"
              >
                {estornando ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Estornar Créditos (R$ {order.discount_amount.toFixed(2)})
              </button>
            )}
          </div>
        </div>
        {order.discount_amount > 0 && (
          <p className="text-xs text-green-600 mt-2">
            💰 {formatPrice(order.discount_amount)} em créditos foram usados neste pedido
          </p>
        )}
      </div>

      {/* Dados do pedido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações do Pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pedido #</span>
              <span className="font-medium">{order.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data</span>
              <span className="font-medium">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium">{order.customer_name || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">E-mail</span>
              <span className="font-medium">{order.email || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo Financeiro</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatPrice(order.subtotal || order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Frete</span>
              <span className="font-medium">{formatPrice(order.shipping_cost || 0)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto (créditos)</span>
                <span>- {formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-[#FFB800]">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preço</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {item.products?.name || 'Produto'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatPrice(item.price)}</td>
                  <td className="px-4 py-2 text-sm font-medium text-right">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
