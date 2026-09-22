'use client'

import {
  Suspense,
  useEffect,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Check, ArrowRight } from 'lucide-react'

function WelcomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const success = searchParams.get('success')
        const sessionId = searchParams.get('session_id')

        console.log('🔎 Welcome - success:', success)
        console.log('🔎 Welcome - session_id:', sessionId)

        /*
         * RETORNO DO STRIPE
         *
         * Quando o usuário volta do Stripe, não dependemos
         * da sessão do Supabase, pois ela pode não estar
         * disponível imediatamente após o retorno.
         */
        if (success === 'true' && sessionId) {
          console.log(
            '💳 Welcome - retorno confirmado do Stripe'
          )

          const response = await fetch(
            `/api/stripe/verify-session?session_id=${encodeURIComponent(
              sessionId
            )}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          )

          const data = await response.json()

          console.log(
            '📦 Welcome - resposta Stripe:',
            data
          )

          if (!response.ok || !data.success) {
            throw new Error(
              data.error ||
                'Não foi possível confirmar o pagamento.'
            )
          }

          setUser({
            id: data.user.id,
          })

          setUserName(
            data.user.full_name || ''
          )

          console.log(
            '✅ Welcome - pagamento confirmado'
          )

          console.log(
            '👤 Welcome - usuário:',
            data.user
          )

          console.log(
            '💳 Welcome - assinatura:',
            data.subscription
          )

          setLoading(false)

          return
        }

        /*
         * ACESSO NORMAL À PÁGINA
         *
         * Se o usuário entrar diretamente na página,
         * usamos a sessão normal do Supabase.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log(
          '🔐 Welcome - usuário:',
          user
        )

        console.log(
          '🔐 Welcome - erro Auth:',
          authError
        )

        if (!user) {
          console.error(
            '❌ Welcome: usuário não autenticado'
          )

          router.push('/auth/login')
          return
        }

        setUser(user)

        const { data: profile } =
          await (supabase.from('profiles') as any)
            .select('full_name')
            .eq('id', user.id)
            .single()

        console.log(
          '👤 Perfil carregado:',
          profile
        )

        if (profile?.full_name) {
          setUserName(profile.full_name)
        }

        setLoading(false)
      } catch (error) {
        console.error(
          '❌ Erro na página Welcome:',
          error
        )

        setLoading(false)
      }
    }

    carregarDados()
  }, [router, searchParams])

  const continuarParaApp = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFB800]/10 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">

          {/* CABEÇALHO */}
          <div className="bg-gradient-to-r from-[#FFB800] to-[#E5A600] px-6 py-8 text-center">

            <div className="flex justify-center mb-4">
              <img
                src="/logo.svg"
                alt="PREPARADO"
                className="h-16 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <h1 className="text-2xl font-bold text-black">
              Bem-vindo(a), {userName || 'Preparado'}!
            </h1>
          </div>

          {/* CONTEÚDO */}
          <div className="p-6 space-y-6">

            {/* STATUS */}
            <div className="text-center">

              <div className="inline-block bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-3">
                <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <Check size={14} />
                  Plano Ativo
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Aproveite o acesso completo!
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Comece sua preparação agora.
              </p>
            </div>

            {/* BENEFÍCIOS */}
            <div className="border-t border-gray-100 pt-4">

              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                O que você tem acesso:
              </h3>

              <div className="space-y-3">

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check
                    size={18}
                    className="text-[#FFB800]"
                  />
                  <span>
                    Conexão com pessoas próximas
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check
                    size={18}
                    className="text-[#FFB800]"
                  />
                  <span>
                    Monitoramento de emergências em tempo real
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check
                    size={18}
                    className="text-[#FFB800]"
                  />
                  <span>
                    Checklist completo de preparação
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check
                    size={18}
                    className="text-[#FFB800]"
                  />
                  <span>
                    Mentoria com especialistas
                  </span>
                </div>

              </div>
            </div>

            {/* BOTÃO */}
            <div className="border-t border-gray-100 pt-4">

              <button
                onClick={continuarParaApp}
                className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                Começar a usar
                <ArrowRight size={18} />
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  )
}