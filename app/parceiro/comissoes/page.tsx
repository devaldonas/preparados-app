'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react'

export default function ParceiroComissoes() {
  const [loading, setLoading] = useState(true)
  const [comissoes, setComissoes] = useState({
    total: 0,
    pendente: 0,
    pago: 0,
    historico: []
  })
  const router = useRouter()

  useEffect(() => {
    const carregarComissoes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Mock - implementar depois
        setComissoes({
          total: 1250.50,
          pendente: 450.00,
          pago: 800.50,
          historico: []
        })
      } catch (error) {
        console.error('Erro ao carregar comissões:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarComissoes()
  }, [])

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black">Comissões</h1>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center gap-2">
            <Download size={18} />
            Exportar
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total de Comissões</p>
            <p className="text-2xl font-bold text-black">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissoes.total)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissoes.pendente)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Pagos</p>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissoes.pago)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-black mb-4">Histórico de Comissões</h2>
          <p className="text-sm text-gray-500">Em breve você poderá ver o histórico completo aqui.</p>
        </div>
      </div>
    </div>
  )
}
