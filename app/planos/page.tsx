'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Check, Loader2, Crown, Zap, Calendar } from 'lucide-react'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  features: string[]
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
      // Verificar usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Buscar planos
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
      // Criar assinatura no Mercado Pago
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

      // 🔥 Redirecionar para o checkout do Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        // Se não tiver initPoint, usar QR Code
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 hover:shadow-lg transition ${
                plan.interval === 'year' 
                  ? 'border-[#FFB800] relative' 
                  : 'border-gray-100'
              }`}
            >
              {plan.interval === 'year' && (
                <div className="absolute -top-3 right-6 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-full">
                  MELHOR PLANO
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                {plan.interval === 'month' ? (
                  <Zap size={20} className="text-blue-500" />
                ) : (
                  <Crown size={20} className="text-[#FFB800]" />
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {plan.name}
                </h2>
              </div>

              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                  / {plan.interval === 'month' ? 'mês' : 'ano'}
                </span>
                {plan.interval === 'year' && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Economize 40%!
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleAssinar(plan)}
                disabled={processing === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  plan.interval === 'year'
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

              {plan.interval === 'year' && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  Cancele quando quiser
                </p>
              )}
            </div>
          ))}
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