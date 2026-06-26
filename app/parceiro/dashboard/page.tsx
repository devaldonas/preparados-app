// app/parceiro/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { Package, DollarSign, ShoppingBag, Users, Plus, Eye, CheckCircle, Clock, XCircle } from 'lucide-react'

interface PartnerStats {
  totalProducts: number
  totalSales: number
  totalCommission: number
  pendingCommission: number
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)
  const [stats, setStats] = useState<PartnerStats>({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0,
    pendingCommission: 0
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      // Verificar usuário
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

      // Buscar estatísticas
      // Produtos do parceiro
      const { count: productCount } = await supabase
        .from('partner_products')
        .select('*', { count: 'exact' })
        .eq('partner_id', partnerData.id)

      // Comissões
      const { data: commissions } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('partner_id', partnerData.id)

      const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0
      const pendingCommission = commissions?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0) || 0

      setStats({
        totalProducts: productCount || 0,
        totalSales: commissions?.length || 0,
        totalCommission: totalCommission,
        pendingCommission: pendingCommission
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      approved: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      rejected: { label: 'Rejeitado', icon: XCircle, color: 'text-red-600 bg-red-50' }
    }
    const info = map[status] || map.pending
    const Icon = info.icon
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${info.color}`}>
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
      <NavBar showBackButton={true} backButtonPath="/" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard do Parceiro</h1>
            <p className="text-sm text-gray-500">
              {partner?.company_name || 'Sua empresa'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {partner?.status !== 'approved' && getStatusBadge(partner?.status)}
            <Link
              href="/parceiro/produtos/novo"
              className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Novo Produto
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Produtos</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Vendas</p>
                <p className="font-display text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Comissões</p>
                <p className="font-display text-2xl font-bold text-green-600">
                  R$ {stats.totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">A Receber</p>
                <p className="font-display text-2xl font-bold text-yellow-600">
                  R$ {stats.pendingCommission.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu do Parceiro */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/parceiro/produtos">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800] text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package size={24} className="text-blue-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Meus Produtos</h3>
              <p className="text-sm text-gray-500">Gerenciar produtos</p>
            </div>
          </Link>

          <Link href="/parceiro/comissoes">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800] text-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Comissões</h3>
              <p className="text-sm text-gray-500">Histórico de comissões</p>
            </div>
          </Link>

          <Link href="/parceiro/perfil">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800] text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Perfil</h3>
              <p className="text-sm text-gray-500">Editar informações</p>
            </div>
          </Link>

          <Link href="/parceiro/ajuda">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer hover:border-[#FFB800] text-center">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye size={24} className="text-yellow-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900">Ajuda</h3>
              <p className="text-sm text-gray-500">Dúvidas e suporte</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}