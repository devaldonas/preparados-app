// app/loja/pedidos/[id]/page.tsx (CORRIGIDO)
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
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
  items: OrderItem[]
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  products?: {
    name: string
    image_url: string
  }
}

export default function DetalhePedido({ params }: { params: Promise<{ id: string }> }) {
  // 🔥 DESEMBRULHAR PARAMS COM use()
  const { id } = use(params)
  
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    carregarUsuario()
  }, [id])

  const carregarUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      await carregarPedido(user.id)
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      setLoading(false)
    }
  }

  const carregarPedido = async (userId: string) => {
    try {
      console.log('🔍 Buscando pedido ID:', id)
      
      // 🔥 CONVERTER ID PARA NÚMERO
      const orderId = parseInt(id)
      if (isNaN(orderId)) {
        throw new Error('ID do pedido inválido')
      }

      // Buscar pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (orderError) {
        console.error('❌ Erro ao buscar pedido:', orderError)
        throw orderError
      }

      console.log('✅ Pedido encontrado:', orderData)

      // 🔥 BUSCAR ITENS COM NOME DO PRODUTO
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (
            name,
            image_url
          )
        `)
        .eq('order_id', orderData.id)

      if (itemsError) {
        console.error('❌ Erro ao buscar itens:', itemsError)
      }

      console.log('📦 Itens encontrados:', items)

      setOrder({ ...orderData, items: items || [] })
    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
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
      pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
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

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            Pedido não encontrado
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Não foi possível encontrar o pedido solicitado.
          </p>
          <Link
            href="/loja/pedidos"
            className="inline-block bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Voltar para meus pedidos
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/loja/pedidos" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Pedido #{order.transaction_id?.slice(-8) || order.id}
            </h1>
            <p className="text-sm text-gray-500">
              Realizado em {formatDate(order.created_at)}
            </p>
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
          {/* Status e itens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-4">
                Status do Pedido
              </h3>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${statusInfo.color}`}>
                  <StatusIcon size={24} />
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900">
                    {statusInfo.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    Pagamento: {getPaymentStatusLabel(order.payment_status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Itens */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-display font-bold text-gray-900 mb-4">
                Itens do Pedido
              </h3>
              <div className="space-y-3">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={item.products?.image_url || '/images/placeholder.jpg'}
                          alt={item.products?.name || 'Produto'}
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {item.products?.name || `Produto ${item.product_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-sm text-[#FFB800]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">Grátis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#FFB800]">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                  <span className={`font-medium ${
                    order.payment_status === 'paid' ? 'text-green-600' :
                    order.payment_status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getPaymentStatusLabel(order.payment_status)}
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

            {/* Endereço */}
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