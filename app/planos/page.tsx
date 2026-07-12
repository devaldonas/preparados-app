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
  const [processing, setProcessing] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)

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
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async (plan: Plan) => {
    setProcessing(plan.id)

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
      setProcessing(null)
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Escolha seu plano
          </h1>
          <p className="text-gray-500 mt-2">
            Teste grátis por 7 dias. Depois escolha o plano que melhor se adapta a você.
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isAnual = plan.interval === 'year'
            const precoMensal = isAnual ? (plan.price / 12) : plan.price
            
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-6 hover:shadow-lg transition ${
                  isAnual 
                    ? 'border-[#FFB800] relative ring-2 ring-[#FFB800]/30' 
                    : 'border-gray-100'
                }`}
              >
                {/* Badge de desconto */}
                {isAnual && (
                  <div className="absolute -top-3 right-6 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-full">
                    40% OFF
                  </div>
                )}

                {/* Nome do plano */}
                <h2 className={`text-xl font-bold mb-2 ${isAnual ? 'text-[#FFB800]' : 'text-gray-900'}`}>
                  {plan.name}
                </h2>

                {/* 🔥 PREÇO COM DESTAQUE - MENSAL */}
                {!isAnual && (
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/mês</span>
                  </div>
                )}

                {/* 🔥 PLANO ANUAL - DESTAQUE NO VALOR MENSAL */}
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

                {/* Acesso completo */}
                <p className="text-xs text-gray-400 mt-3">
                   Acesso completo a todas as funcionalidades
                </p>

                {/* Botão Assinar */}
                <button
                  onClick={() => handleAssinar(plan)}
                  disabled={processing === plan.id}
                  className={`w-full mt-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isAnual
                      ? 'bg-[#FFB800] hover:bg-[#E5A600] text-black'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } disabled:opacity-50`}
                >
                  {processing === plan.id ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Assinar agora'
                  )}
                </button>

                {isAnual && (
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Cancele quando quiser
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Ao assinar, você concorda com nossos termos de uso.
          Pagamento seguro via Mercado Pago.
        </p>
      </div>
    </div>
  )
}