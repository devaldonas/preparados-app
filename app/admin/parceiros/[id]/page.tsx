'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Building, 
  Package, 
  ShoppingBag, 
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  User,
  Phone
} from 'lucide-react'

interface Partner {
  id: string
  user_id: string
  company_name: string
  cnpj: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  description: string
  website: string
  status: string
  created_at: string
  updated_at: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image_url: string
  is_active: boolean
  created_at: string
}

interface Order {
  id: number
  user_id: string
  total_amount: number
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  customer_name: string
  customer_email: string
}

export default function PartnerDetalhes({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminGuard>
      <PartnerDetalhesContent params={params} />
    </AdminGuard>
  )
}

function PartnerDetalhesContent({ params }: { params: Promise<{ id: string }> }) {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'produtos' | 'vendas'>('produtos')
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const router = useRouter()

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { id } = await params
        
        console.log('📋 Carregando dados do parceiro:', id)

        // Buscar dados do parceiro
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('*')
          .eq('id', id)
          .single()

        if (partnerError) throw partnerError
        setPartner(partnerData)

        // Buscar perfil do usuário
        if (partnerData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerData.user_id)
            .single()
          setProfile(profileData)
        }

        // BUSCAR PRODUTOS DO PARCEIRO
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('partner_id', id)
          .order('created_at', { ascending: false })

        if (!productsError) {
          setProducts(productsData || [])
          
          // Calcular estatísticas de produtos
          const total = productsData?.length || 0
          const active = productsData?.filter((p: Product) => p.is_active === true).length || 0
          setStats(prev => ({ ...prev, totalProducts: total, activeProducts: active }))
        }

        // BUSCAR VENDAS (pedidos) DO PARCEIRO
        const productIds = productsData?.map((p: Product) => p.id) || []

        if (productIds.length > 0) {
          const { data: orderItems, error: orderItemsError } = await supabase
            .from('order_items')
            .select(`
              order_id,
              price,
              quantity,
              product_id
            `)
            .in('product_id', productIds)

          if (!orderItemsError && orderItems && orderItems.length > 0) {
            const orderIds = [...new Set(orderItems.map((item: any) => item.order_id))]
            
            if (orderIds.length > 0) {
              const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
                  *,
                  profiles:user_id (
                    full_name,
                    email
                  )
                `)
                .in('id', orderIds)
                .order('created_at', { ascending: false })

              if (!ordersError && ordersData) {
                const ordersWithTotal = ordersData.map((order: any) => {
                  const items = orderItems.filter((item: any) => item.order_id === order.id)
                  const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                  
                  const profile = order.profiles as any
                  
                  return {
                    ...order,
                    total_amount: total,
                    customer_name: profile?.full_name || 'Cliente',
                    customer_email: profile?.email || '-'
                  }
                })

                setOrders(ordersWithTotal)

                const totalRevenue = ordersWithTotal.reduce((sum: number, order: any) => sum + order.total_amount, 0)
                setStats(prev => ({ 
                  ...prev, 
                  totalOrders: ordersWithTotal.length,
                  totalRevenue: totalRevenue
                }))
              }
            }
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push('/admin/parceiros')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [params, router])

  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Aprovado</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pendente</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Rejeitado</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{status}</span>
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Entregue</span>
      case 'shipped':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Enviado</span>
      case 'processing':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Processando</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Cancelado</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">Pendente</span>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Pago</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pendente</span>
      case 'failed':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Falhou</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Parceiro não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/parceiros"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">{partner.company_name}</h1>
            <p className="text-sm text-gray-500">Detalhes do parceiro</p>
          </div>
          <div className="ml-auto">
            {getStatusBadge(partner.status)}
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-400">{stats.activeProducts} ativos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendas</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-gray-400">pedidos realizados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFB800]/10 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-[#FFB800]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Faturamento</p>
                <p className="text-xl font-bold text-gray-900">{formatarMoeda(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-400">total em vendas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Média por pedido</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalOrders > 0 
                    ? formatarMoeda(stats.totalRevenue / stats.totalOrders)
                    : formatarMoeda(0)}
                </p>
                <p className="text-xs text-gray-400">ticket médio</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('produtos')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'produtos'
                    ? 'text-[#FFB800] border-b-2 border-[#FFB800]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package size={16} className="inline mr-2" />
                Produtos ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('vendas')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'vendas'
                    ? 'text-[#FFB800] border-b-2 border-[#FFB800]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShoppingBag size={16} className="inline mr-2" />
                Vendas ({orders.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* TAB PRODUTOS */}
            {activeTab === 'produtos' && (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Este parceiro ainda não tem produtos cadastrados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                          <th className="pb-3 pr-4">Produto</th>
                          <th className="pb-3 pr-4">Categoria</th>
                          <th className="pb-3 pr-4">Preço</th>
                          <th className="pb-3 pr-4">Estoque</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded-lg"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package size={16} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-sm text-gray-600">{product.category}</td>
                            <td className="py-3 pr-4 text-sm font-medium text-gray-900">{formatarMoeda(product.price)}</td>
                            <td className="py-3 pr-4">
                              <span className={`text-sm ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {product.stock > 0 ? `${product.stock} unidades` : 'Esgotado'}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              {product.is_active ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Ativo</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">Inativo</span>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-sm text-gray-500">
                              {new Date(product.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* TAB VENDAS */}
            {activeTab === 'vendas' && (
              <>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Este parceiro ainda não realizou vendas.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                          <th className="pb-3 pr-4">Pedido</th>
                          <th className="pb-3 pr-4">Cliente</th>
                          <th className="pb-3 pr-4">Total</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Pagamento</th>
                          <th className="pb-3 pr-4">Data</th>
                          <th className="pb-3 pr-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 pr-4 text-sm font-medium text-gray-900">
                              #{order.id}
                            </td>
                            <td className="py-3 pr-4">
                              <div>
                                <p className="text-sm text-gray-900">{order.customer_name}</p>
                                <p className="text-xs text-gray-500">{order.customer_email}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-sm font-medium text-gray-900">
                              {formatarMoeda(order.total_amount)}
                            </td>
                            <td className="py-3 pr-4">
                              {getOrderStatusBadge(order.status)}
                            </td>
                            <td className="py-3 pr-4">
                              {getPaymentStatusBadge(order.payment_status)}
                            </td>
                            <td className="py-3 pr-4 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 pr-4">
                              <button
                                onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                title="Ver pedido"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* INFORMAÇÕES DO PARCEIRO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building size={20} className="text-[#FFB800]" />
              Informações da Empresa
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{partner.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="font-medium">{formatarCNPJ(partner.cnpj)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{partner.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">{partner.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="font-medium">
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] hover:underline">
                      {partner.website}
                    </a>
                  ) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-[#FFB800]" />
              Endereço
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Endereço</p>
                <p className="font-medium">{partner.address || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Cidade</p>
                  <p className="font-medium">{partner.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-medium">{partner.state || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">CEP</p>
                <p className="font-medium">{partner.zip || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cadastrado em</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {new Date(partner.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-[#FFB800]" />
              Informações do Usuário
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{profile?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile?.email || '-'}</p>
              </div>
              {profile?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">ID do Usuário</p>
                <p className="font-medium text-xs text-gray-500">{partner.user_id}</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {partner.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-600">{partner.description}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/admin/parceiros"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar
          </Link>
          <Link
            href={`/admin/parceiros/${partner.id}/editar`}
            className="bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  )
}
