'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Crown, Check } from 'lucide-react'

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

      // 🔥 Redirecionar para o Mercado Pago para cadastrar o cartão
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        // Fallback: ir para welcome
        router.push('/auth/welcome')
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Escolha seu plano
          </h1>
          <p className="text-gray-600 mt-2">
            Teste grátis por 7 dias. Cancele a qualquer momento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
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
                    Melhor Custo-Benefício
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${isAnual ? 'text-[#FFB800]' : 'text-gray-900'}`}>
                    {plan.name}
                  </h2>
                  {isSelected && (
                    <span className="bg-[#FFB800] text-black text-xs font-bold px-2 py-1 rounded-full">
                      SELECIONADO
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(isAnual ? precoMensal : plan.price)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/mês</span>
                </div>

                {isAnual && (
                  <p className="text-sm text-gray-500">
                    Total: {formatPrice(plan.price)}/ano
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  ✅ Acesso completo a todos os recursos
                </p>
              </div>
            )
          })}
        </div>

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
              <>
                <Crown size={20} />
                Teste Grátis por 7 dias
              </>
            )}
          </button>

          <div className="mt-4 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg text-center max-w-md">
            <p>
              Seu cartão <strong>não será cobrado</strong> durante os 7 dias de teste.
              <br />
              A cobrança começa automaticamente após o período gratuito.
              <br />
              Você pode cancelar a qualquer momento.
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
