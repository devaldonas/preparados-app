'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Crown, Check, CreditCard, QrCode } from 'lucide-react'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  is_active: boolean
}

export default function PlanosPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

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
      setUser(user)

      const { data, error } = await (supabase
        .from('plans') as any)
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
      
      if (data && data.length > 0) {
        setSelectedPlan(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async () => {
    if (!selectedPlan) {
      alert('Selecione um plano')
      return
    }

    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return

    setProcessing(true)

    try {
      const response = await fetch('/api/assinatura/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: 39.69,
          interval: plan.interval,
          userId: user.id,
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      // 🔥 Redirecionar para o Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint
      }

    } catch (error) {
      console.error('Erro ao assinar:', error)
      alert('Erro ao processar assinatura. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Plano Anual
          </h1>
          <p className="text-gray-600 mt-2">
            Acesso completo a todos os recursos do PREPARADO
          </p>
        </div>

        {/* Plano Único */}
        <div className="bg-white rounded-2xl border-2 border-[#FFB800] shadow-lg p-8 max-w-lg mx-auto">
          <div className="text-center">
            <div className="inline-block bg-[#FFB800]/10 px-4 py-1 rounded-full mb-4">
              <span className="text-sm font-semibold text-[#FFB800]">⭐ Melhor plano</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Plano Anual</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">12x de</span>
              <span className="text-5xl font-bold text-[#FFB800] ml-2">R$ 39,69</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">ou R$ 476,28 à vista no PIX</p>
            <p className="text-sm text-gray-400 line-through mt-2">
              De R$ 179,90/mês
            </p>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Benefícios:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Acesso completo à plataforma</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Mentoria com especialistas</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Monitoramento de emergências em tempo real</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Checklist completo de preparação</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Descontos exclusivos na loja</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Suporte prioritário</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={handleAssinar}
              disabled={processing}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {processing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Assinar agora
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Pagamento seguro via Mercado Pago
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 Pagamento seguro</span>
            <span>•</span>
            <span>💳 12x sem juros</span>
            <span>•</span>
            <span>📱 PIX disponível</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao assinar, você concorda com nossos termos de uso.
          Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}
