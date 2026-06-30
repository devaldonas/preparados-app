// app/parceiro/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import Link from 'next/link'
import { Package, DollarSign, Plus, LogOut, ShoppingBag, TrendingUp } from 'lucide-react'

export default function PartnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0
  })

  useEffect(() => {
    verificarAcesso()
  }, [])

  const verificarAcesso = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'partner') {
        router.push('/dashboard')
        return
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (partnerError || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      if (partnerData.status !== 'approved') {
        router.push('/parceiro/aguardando-aprovacao')
        return
      }

      setPartner(partnerData)

      // 🔥 Estatísticas: produtos do parceiro
      const { data: products, count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('partner_id', partnerData.id)

      setStats({
        totalProducts: productCount || 0,
        totalSales: 0,
        totalCommission: 0
      })

    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard do Parceiro</h1>
            <p className="text-sm text-gray-500">{partner?.company_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/parceiro/produtos/novo"
              className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Novo Produto
            </Link>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] text-gray-500 font-display tracking-wider uppercase">Comissões</p>
                <p className="font-display text-2xl font-bold text-[#FFB800]">
                  R$ {stats.totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-[#FFB800]" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu do parceiro */}
        <div className="grid grid-cols-3 gap-4">
          <Link href="/parceiro/produtos">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer text-center">
              <Package size={32} className="mx-auto text-blue-600 mb-2" />
              <h3 className="font-display font-bold text-gray-900">Meus Produtos</h3>
              <p className="text-sm text-gray-500">Gerenciar produtos</p>
            </div>
          </Link>

          <Link href="/parceiro/comissoes">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer text-center">
              <DollarSign size={32} className="mx-auto text-[#FFB800] mb-2" />
              <h3 className="font-display font-bold text-gray-900">Comissões</h3>
              <p className="text-sm text-gray-500">Histórico de comissões</p>
            </div>
          </Link>

          <Link href="/parceiro/perfil">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition cursor-pointer text-center">
              <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="font-display font-bold text-gray-900">Perfil</h3>
              <p className="text-sm text-gray-500">Editar informações</p>
            </div>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ Você está logado como <strong>Parceiro</strong>. 
            Seus produtos aparecerão na loja após aprovação.
          </p>
        </div>
      </div>
    </div>
  )
}