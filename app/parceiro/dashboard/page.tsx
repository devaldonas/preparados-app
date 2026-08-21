// app/parceiro/dashboard/page.tsx (ATUALIZADO)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingBag, DollarSign, TrendingUp, ArrowRight, Plus } from 'lucide-react'

export default function ParceiroDashboard() {
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)
  const [stats, setStats] = useState({
    pedidos: 0,
    produtos: 0,
    comissoes: 0,
    vendas: 0
  })
  const router = useRouter()

  useEffect(() => {
    const verificarParceiro = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // 🔥 VERIFICAR SE É PARCEIRO
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        // 🔥 BUSCAR PARCEIRO
        const { data: partnerData } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('🔍 Verificando parceiro:', { profile, partnerData })

        // Se não for parceiro, redireciona para dashboard normal
        if (profile?.role !== 'partner' && partnerData?.status !== 'approved') {
          console.log('❌ Não é parceiro - redirecionando para /dashboard')
          router.push('/dashboard')
          return
        }

        setPartner(partnerData)
        await carregarDados(partnerData)

      } catch (error) {
        console.error('❌ Erro ao verificar parceiro:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    verificarParceiro()
  }, [router])

  const carregarDados = async (partnerData: any) => {
    try {
      console.log('🔍 Carregando dados do parceiro...')
      
      if (!partnerData) {
        console.log('❌ Parceiro não encontrado')
        return
      }

      console.log('✅ Parceiro ID:', partnerData.id)

      // 🔥 Buscar produtos do parceiro
      const { data: produtos, error: produtosError } = await supabase
        .from('products')
        .select('id, name, stock, price')
        .eq('partner_id', partnerData.id)

      if (produtosError) {
        console.error('❌ Erro ao buscar produtos:', produtosError)
      }

      const productIds = produtos?.map((p: any) => p.id) || []
      console.log('📦 Produtos do parceiro:', productIds.length)

      // 🔥 Buscar pedidos que contêm produtos do parceiro
      let totalPedidos = 0
      let totalVendas = 0

      if (productIds.length > 0) {
        // Buscar todos os pedidos
        const { data: pedidos, error: pedidosError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (pedidosError) {
          console.error('❌ Erro ao buscar pedidos:', pedidosError)
        } else if (pedidos) {
          // 🔥 Buscar os itens dos pedidos para verificar se contêm produtos do parceiro
          for (const pedido of pedidos) {
            const { data: items } = await supabase
              .from('order_items')
              .select('product_id')
              .eq('order_id', pedido.id)

            if (items) {
              const hasPartnerProduct = items.some((item: any) => 
                productIds.includes(item.product_id)
              )
              if (hasPartnerProduct) {
                totalPedidos++
                // Só contar vendas se o pedido estiver pago ou entregue
                if (pedido.status === 'paid' || pedido.status === 'shipped' || pedido.status === 'delivered') {
                  totalVendas += parseFloat(pedido.total_amount) || 0
                }
              }
            }
          }
        }
      }

      // 🔥 Estatísticas
      const comissoes = totalVendas * 0.15 // 15% de comissão

      console.log('📊 Stats:', {
        pedidos: totalPedidos,
        produtos: produtos?.length || 0,
        comissoes: comissoes,
        vendas: totalVendas
      })

      setStats({
        pedidos: totalPedidos,
        produtos: produtos?.length || 0,
        comissoes: comissoes,
        vendas: totalVendas
      })

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
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
        
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Dashboard Parceiro</h1>
            <p className="text-sm text-gray-500">
              {partner?.company_name || 'Sua loja'}
            </p>
          </div>
          <Link
            href="/parceiro/produtos/novo"
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Produto
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-2xl font-bold text-black">{stats.pedidos}</p>
              </div>
              <div className="w-10 h-10 bg-[#FFB800]/10 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-[#FFB800]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <p className="text-2xl font-bold text-black">{stats.produtos}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Comissões</p>
                <p className="text-2xl font-bold text-black">
                  {formatarMoeda(stats.comissoes)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendas (mês)</p>
                <p className="text-2xl font-bold text-black">
                  {formatarMoeda(stats.vendas)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Links rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/parceiro/pedidos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Package size={20} className="text-[#FFB800]" />
              <span className="font-medium text-black">Expedição</span>
              <span className="text-xs bg-[#FFB800]/10 text-[#FFB800] px-2 py-0.5 rounded-full">
                {stats.pedidos}
              </span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>

          <Link
            href="/parceiro/produtos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-blue-500" />
              <span className="font-medium text-black">Meus Produtos</span>
              <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                {stats.produtos}
              </span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>

          <Link
            href="/parceiro/comissoes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-green-500" />
              <span className="font-medium text-black">Comissões</span>
              <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full">
                {formatarMoeda(stats.comissoes)}
              </span>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}