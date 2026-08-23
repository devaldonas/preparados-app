'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { Check, X, Eye, Store, Users } from 'lucide-react'

interface Partner {
  id: string
  user_id: string
  company_name: string
  cnpj: string
  email: string
  phone: string
  status: string
  created_at: string
  updated_at: string
  total_orders?: number
  total_revenue?: number
}

interface Product {
  id: number
}

interface OrderItem {
  order_id: number
  price: number
  quantity: number
}

function AdminParceirosContent() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const router = useRouter()

  useEffect(() => {
    carregarParceiros()
  }, [])

  const carregarParceiros = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os parceiros
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (partnersError) throw partnersError

      const partnersList = (partnersData as Partner[]) || []
      
      // Buscar perfis
      const userIds = partnersList.map(p => p.user_id).filter(id => id)
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (!profilesError && profiles) {
          const map: Record<string, any> = {}
          profiles.forEach((p: any) => {
            map[p.id] = p
          })
          setProfilesMap(map)
        }
      }

      // Calcular vendas de cada parceiro
      const partnersWithStats = await Promise.all(
        partnersList.map(async (partner: Partner) => {
          // Buscar produtos do parceiro
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('partner_id', partner.id)

          const productIds = (products || []).map((p: Product) => p.id)

          if (productIds.length === 0) {
            return { ...partner, total_orders: 0, total_revenue: 0 }
          }

          // Buscar itens de pedidos
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('order_id, price, quantity')
            .in('product_id', productIds)

          if (!orderItems || orderItems.length === 0) {
            return { ...partner, total_orders: 0, total_revenue: 0 }
          }

          const orderIds = [...new Set((orderItems as OrderItem[]).map((item: OrderItem) => item.order_id))]

          // Buscar pedidos pagos
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)
            .eq('payment_status', 'paid')

          const paidOrderIds = (orders || []).map((o: { id: number }) => o.id)

          const totalOrders = paidOrderIds.length
          const totalRevenue = (orderItems as OrderItem[])
            .filter((item: OrderItem) => paidOrderIds.includes(item.order_id))
            .reduce((sum: number, item: OrderItem) => sum + (item.price * item.quantity), 0)

          return { ...partner, total_orders: totalOrders, total_revenue: totalRevenue }
        })
      )

      setPartners(partnersWithStats)

    } catch (error) {
      console.error('Erro ao carregar parceiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (partnerId: string, novoStatus: string) => {
    if (!confirm(`Tem certeza que deseja ${novoStatus === 'approved' ? 'aprovar' : 'rejeitar'} este parceiro?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('partners')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)

      if (error) throw error

      await carregarParceiros()
      alert(`Parceiro ${novoStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Aprovado</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pendente</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Rejeitado</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>
    }
  }

  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Parceiros</h1>
            <p className="text-gray-500 text-sm">Gerencie os parceiros vendedores</p>
          </div>
          <Link href="/admin" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">
            ← Voltar
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum parceiro cadastrado ainda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Parceiro</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">CNPJ</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Vendas</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Faturamento</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Data</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => {
                    const profile = profilesMap[partner.user_id]
                    const nomeExibicao = partner.company_name || profile?.full_name || 'Usuário'
                    
                    return (
                      <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                              <Users size={18} className="text-[#FFB800]" />
                            </div>
                            <div>
                              <p className="font-medium text-black">{nomeExibicao}</p>
                              <p className="text-sm text-gray-500">{partner.email || profile?.email || 'Sem email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{formatarCNPJ(partner.cnpj)}</td>
                        <td className="p-4">{getStatusBadge(partner.status)}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{partner.total_orders || 0}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{formatarMoeda(partner.total_revenue || 0)}</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(partner.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {partner.status === 'pending' && (
                              <>
                                <button onClick={() => atualizarStatus(partner.id, 'approved')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Aprovar">
                                  <Check size={18} />
                                </button>
                                <button onClick={() => atualizarStatus(partner.id, 'rejected')} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Rejeitar">
                                  <X size={18} />
                                </button>
                              </>
                            )}
                            <button onClick={() => router.push(`/admin/parceiros/${partner.id}`)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Ver detalhes">
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminParceiros() {
  return (
    <AdminGuard>
      <AdminParceirosContent />
    </AdminGuard>
  )
}
