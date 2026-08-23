'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { ArrowLeft, User, Package, CreditCard, Calendar, Truck, DollarSign } from 'lucide-react'

interface Order {
  id: number
  user_id: string
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  transaction_id: string
  shipping_address: any
  created_at: string
  updated_at: string
  email: string
  customer_name: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  product: {
    id: number
    name: string
    price: number
    image_url: string
    category: string
  }
}

function OrderDetalhesContent({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [shippingAddress, setShippingAddress] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { id } = await params
        const orderId = parseInt(id)

        console.log('📋 Carregando pedido:', orderId)

        // Buscar pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError) throw orderError
        setOrder(orderData)

        // 🔥 PARSE DO ENDEREÇO
        if (orderData.shipping_address) {
          try {
            const parsed = typeof orderData.shipping_address === 'string' 
              ? JSON.parse(orderData.shipping_address) 
              : orderData.shipping_address
            setShippingAddress(parsed)
          } catch (e) {
            console.error('Erro ao parsear endereço:', e)
            setShippingAddress(orderData.shipping_address)
          }
        }

        // Buscar perfil do usuário
        if (orderData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone, city, state, street, number, complement, neighborhood, cep')
            .eq('id', orderData.user_id)
            .maybeSingle()
          setProfile(profileData)
        }

        // Buscar itens do pedido
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products (
              id,
              name,
              price,
              image_url,
              category
            )
          `)
          .eq('order_id', orderId)

        if (!itemsError) {
          setItems(itemsData || [])
        }

      } catch (error) {
        console.error('Erro ao carregar pedido:', error)
        router.push('/admin/pedidos')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [params, router])

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'processing':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Pago</span>
      case 'delivered':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">Entregue</span>
      case 'shipped':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">Enviado</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pendente</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Cancelado</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{status}</span>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Pago</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pendente</span>
      case 'failed':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Falhou</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Pedido não encontrado</p>
      </div>
    )
  }

  // 🔥 NOME DO CLIENTE
  const nomeCliente = order.customer_name || profile?.full_name || 'Cliente'
  const emailCliente = order.email || profile?.email || '-'

  // 🔥 ENDEREÇO FORMATADO
  const enderecoCompleto = shippingAddress ? (
    <>
      {shippingAddress.street && <span>{shippingAddress.street}{shippingAddress.number ? `, ${shippingAddress.number}` : ''}</span>}
      {shippingAddress.complement && <span> - {shippingAddress.complement}</span>}
      {shippingAddress.neighborhood && <span><br/>{shippingAddress.neighborhood}</span>}
      {shippingAddress.city && <span>, {shippingAddress.city}</span>}
      {shippingAddress.state && <span> - {shippingAddress.state}</span>}
      {shippingAddress.zip && <span><br/>CEP: {shippingAddress.zip}</span>}
    </>
  ) : (
    order.shipping_address || 'Endereço não informado'
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/pedidos"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Pedido #{order.id}</h1>
            <p className="text-sm text-gray-500">Detalhes do pedido</p>
          </div>
          <div className="ml-auto">
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informações do Pedido */}
          <div className="md:col-span-2 space-y-6">
            {/* Itens do Pedido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-[#FFB800]" />
                Itens do Pedido
              </h2>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    {item.product?.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product?.name || 'Produto'}</p>
                      <p className="text-sm text-gray-500">{item.product?.category || '-'}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">{item.quantity}x</span>
                        <span className="font-medium text-gray-900">
                          {formatarMoeda(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total do Pedido</span>
                  <span className="text-[#FFB800]">{formatarMoeda(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Informações de Pagamento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-[#FFB800]" />
                Informações de Pagamento
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Método</span>
                  <span className="font-medium">{order.payment_method || 'PIX'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  {getPaymentStatusBadge(order.payment_status)}
                </div>
                {order.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transação</span>
                    <span className="font-mono text-xs text-gray-600">{order.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-[#FFB800]" />
                Cliente
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{nomeCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{emailCliente}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck size={20} className="text-[#FFB800]" />
                Endereço
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium break-words">{enderecoCompleto}</p>
                </div>
              </div>
            </div>

            {/* Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-[#FFB800]" />
                Data
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Criado em</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última atualização</p>
                  <p className="font-medium">{new Date(order.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/admin/pedidos"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetalhes({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminGuard>
      <OrderDetalhesContent params={params} />
    </AdminGuard>
  )
}
