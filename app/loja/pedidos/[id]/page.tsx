// app/loja/pedidos/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, CheckCircle, Truck, AlertCircle, Printer } from 'lucide-react'

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
  items: any[]
}

export default function DetalhePedido({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
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
    await carregarPedido(user.id)
  }

  const carregarPedido = async (userId: string) => {
    try {
      // Buscar pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parseInt(params.id))
        .eq('user_id', userId)
        .single()

      if (orderError) throw orderError

      // Buscar itens do pedido
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id)

      setOrder({ ...orderData, items: items || [] })
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      router.push('/loja/pedidos')
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
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'Aguardando', color: 'text-yellow-600' },
      paid: { label: 'Pago', color: 'text-green-600' },
      failed: { label: 'Falhou', color: 'text-red-600' },
      refunded: { label: 'Reembolsado', color: 'text-gray-600' }
    }
    return map[status] || { label: status, color: 'text-gray-600' }
  }

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: 'Pedido criado', icon: Package },
      { key: 'paid', label: 'Pagamento confirmado', icon: CheckCircle },
      { key: 'processing', label: 'Preparando envio', icon: Package },
      { key: 'shipped', label: 'Enviado', icon: Truck },
      { key: 'delivered', label: 'Entregue', icon: CheckCircle },
    ]

    const currentIndex = steps.findIndex(s => s.key === status)
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido não encontrado</p>
          <Link href="/loja/pedidos" className="text-[#FFB800] hover:underline">
            Voltar para meus pedidos
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon
  const paymentInfo = getPaymentStatusLabel(order.payment_status)
  const steps = getStatusSteps(order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/loja/pedidos" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                Pedido #{order.transaction_id?.slice(-8) || order.id}
              </h1>
              <p className="text-sm text-gray-500">
                Realizado em {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status e informações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status do pedido */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-4">
                Status do Pedido
              </h3>
              
              <div className="relative">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex items-start gap-4 mb-4 last:mb-0">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-[#FFB800] text-black' 
                            : step.active 
                              ? 'bg-[#FFB800] text-black animate-pulse' 
                              : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon size={16} />
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`absolute top-8 left-1/2 w-0.5 h-10 -translate-x-1/2 ${
                            step.completed ? 'bg-[#FFB800]' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-display font-bold text-sm ${
                          step.completed ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                          {step.active && (
                            <span className="ml-2 text-[0.6rem] text-[#FFB800] font-display tracking-wider">
                              • ATUAL
                            </span>
                          )}
                        </p>
                        {step.completed && step.key === 'delivered' && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ Pedido entregue com sucesso!
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Itens do pedido */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-4">
                Itens do Pedido
              </h3>
              
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {item.name || `Produto ${item.product_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-sm text-[#FFB800]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">Grátis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#FFB800]">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Informações adicionais */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pagamento */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-3">
                Pagamento
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Método</span>
                  <span className="text-gray-900 font-medium uppercase">
                    {order.payment_method || 'PIX'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${paymentInfo.color}`}>
                    {paymentInfo.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transação</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {order.transaction_id?.slice(-12) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Endereço de entrega */}
            {order.shipping_address && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-display font-bold text-gray-900 mb-3">
                  Endereço de Entrega
                </h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {order.shipping_address}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-3">
                Precisa de ajuda?
              </h3>
              <div className="space-y-2">
                <Link
                  href="/contato"
                  className="block w-full text-center text-sm text-[#FFB800] border border-[#FFB800] rounded-lg py-2 hover:bg-[#FFB800] hover:text-black transition"
                >
                  Falar com suporte
                </Link>
                <Link
                  href="/loja"
                  className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  ← Voltar para a loja
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}