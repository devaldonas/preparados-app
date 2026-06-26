// app/parceiro/comissoes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface Commission {
  id: string
  order_id: number
  product_id: number
  amount: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string
  created_at: string
  product?: {
    name: string
  }
}

export default function PartnerComissoes() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [partner, setPartner] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar dados do parceiro
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (partnerError || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)

      // Buscar comissões
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('partner_commissions')
        .select(`
          *,
          products:product_id (
            name
          )
        `)
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      if (commissionsError) {
        console.error('Erro ao carregar comissões:', commissionsError)
      } else {
        setCommissions(commissionsData || [])
        
        // Calcular estatísticas
        const total = commissionsData?.length || 0
        const pending = commissionsData?.filter(c => c.status === 'pending').length || 0
        const paid = commissionsData?.filter(c => c.status === 'paid').length || 0
        const totalAmount = commissionsData?.reduce((sum, c) => sum + c.commission_amount, 0) || 0

        setStats({
          total,
          pending,
          paid,
          totalAmount
        })
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      paid: { label: 'Pago', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600 bg-red-50' }
    }
    const info = map[status] || map.pending
    const Icon = info.icon
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
        <Icon size={14} />
        {info.label}
      </div>
    )
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
      <NavBar showBackButton={true} backButtonPath="/parceiro/dashboard" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Comissões</h1>
            <p className="text-sm text-gray-500">
              {partner?.company_name || 'Sua empresa'}
            </p>
          </div>
          <Link
            href="/parceiro/dashboard"
            className="text-sm text-[#FFB800] hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Total</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pendentes</p>
                <p className="font-display text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pagas</p>
                <p className="font-display text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Valor Total</p>
                <p className="font-display text-2xl font-bold text-[#FFB800]">
                  {formatPrice(stats.totalAmount)}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#FFB800]/10 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-[#FFB800]" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Comissões */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {commissions.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma comissão encontrada</p>
              <p className="text-sm text-gray-400">
                Quando seus produtos forem vendidos, as comissões aparecerão aqui.
              </p>
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
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">
                          #{commission.order_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {commission.products?.name || `Produto ${commission.product_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {formatPrice(commission.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-display font-bold text-[#FFB800]">
                            {formatPrice(commission.commission_amount)}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            ({commission.commission_rate}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(commission.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(commission.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {commissions.length} comissões
        </div>
      </div>
    </div>
  )
}