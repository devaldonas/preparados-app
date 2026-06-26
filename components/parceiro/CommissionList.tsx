// components/parceiro/CommissionList.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Filter } from 'lucide-react'

interface Commission {
  id: string
  partner_id: string
  order_id: number
  product_id: number
  amount: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string
  created_at: string
  products?: {
    name: string
    price: number
  }
  orders?: {
    id: number
    created_at: string
  }
}

interface CommissionListProps {
  partnerId: string
  showFilters?: boolean
}

export default function CommissionList({ partnerId, showFilters = true }: CommissionListProps) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0
  })

  useEffect(() => {
    if (partnerId) {
      carregarComissoes()
    }
  }, [partnerId, filterStatus])

  const carregarComissoes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('partner_commissions')
        .select(`
          *,
          products:product_id (
            name,
            price
          ),
          orders:order_id (
            id,
            created_at
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'todos') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar comissões:', error)
        return
      }

      setCommissions(data || [])

      // Calcular resumo
      const total = data?.length || 0
      const pending = data?.filter(c => c.status === 'pending').length || 0
      const paid = data?.filter(c => c.status === 'paid').length || 0
      const totalAmount = data?.reduce((sum, c) => sum + c.commission_amount, 0) || 0
      const pendingAmount = data?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0) || 0

      setSummary({
        total,
        pending,
        paid,
        totalAmount,
        pendingAmount
      })

    } catch (error) {
      console.error('Erro:', error)
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
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
        <Icon size={14} />
        {info.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Total</p>
          <p className="font-display text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pendentes</p>
          <p className="font-display text-2xl font-bold text-yellow-600">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Pagas</p>
          <p className="font-display text-2xl font-bold text-green-600">{summary.paid}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Total</p>
          <p className="font-display text-xl font-bold text-[#FFB800]">
            {formatPrice(summary.totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">A Receber</p>
          <p className="font-display text-xl font-bold text-yellow-600">
            {formatPrice(summary.pendingAmount)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={18} className="text-gray-400" />
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === 'todos'
                ? 'bg-[#FFB800] text-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === 'paid'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pagas
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Canceladas
          </button>
        </div>
      )}

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
                        #{commission.orders?.id || commission.order_id}
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
    </div>
  )
}