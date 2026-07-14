'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

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

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
      
      const annualPlan = data?.find(p => p.interval === 'year')
      if (annualPlan) {
        setSelectedPlan(annualPlan.id)
      } else if (data && data.length > 0) {
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
          price: plan.price,
          interval: plan.interval,
          userId: user.id,
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        router.push(`/planos/pagamento?payment_id=${data.paymentId}`)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.interval === 'year' && b.interval === 'month') return -1
    if (a.interval === 'month' && b.interval === 'year') return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Escolha seu plano
          </h1>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {sortedPlans.map((plan) => {
            const isAnual = plan.interval === 'year'
            const precoMensal = isAnual ? (plan.price / 12) : plan.price
            const isSelected = selectedPlan === plan.id
            
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`bg-white rounded-2xl border-2 p-6 hover:shadow-lg transition cursor-pointer ${
                  isSelected 
                    ? 'border-[#FFB800] ring-2 ring-[#FFB800]/30 shadow-md' 
                    : 'border-gray-100 hover:border-gray-300'
                } ${isAnual ? 'relative' : ''}`}
              >
                {isAnual && (
                  <div className="absolute -top-3 right-6 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-full">
                    40% OFF
                  </div>
                )}

                <h2 className={`text-xl font-bold mb-2 ${isAnual ? 'text-[#FFB800]' : 'text-gray-900'}`}>
                  {plan.name}
                </h2>

                {!isAnual && (
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/mês</span>
                  </div>
                )}

                {isAnual && (
                  <>
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-[#FFB800]">
                        {formatPrice(precoMensal)}
                      </span>
                      <span className="text-sm font-semibold text-gray-600 ml-1">/mês</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Total: {formatPrice(plan.price)}/ano
                    </p>
                  </>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  ✅ Acesso completo
                </p>

                {isSelected && (
                  <div className="mt-3 text-xs text-[#FFB800] font-semibold">
                    ✓ Plano selecionado
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 🔥 BOTÃO E INFORMAÇÃO DO CARTÃO */}
        <div className="mt-10 flex flex-col items-center">
          <button
            onClick={handleAssinar}
            disabled={processing || !selectedPlan}
            className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold px-8 py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {processing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Processando...
              </>
            ) : (
              'Teste Grátis por 7 dias'
            )}
          </button>

          {/* 🔥 INFORMAÇÃO SOBRE O CARTÃO - COM FUNDO DESTACADO */}
          <div className="mt-4 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg text-center max-w-md">
            <p>
              Seu cartão <strong>não será cobrado</strong> durante os 7 dias de teste.
              <br />
              A cobrança começa automaticamente após o período gratuito.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao assinar, você concorda com nossos termos de uso.
          Pagamento seguro via Mercado Pago.
        </p>
      </div>
    </div>
  )
}