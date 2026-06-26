// app/auth/welcome/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Calendar, Clock, Check, ArrowRight, Shield, Zap, Users } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null)
  const [daysLeft, setDaysLeft] = useState(30)
  const [hoursLeft, setHoursLeft] = useState(0)
  const [minutesLeft, setMinutesLeft] = useState(0)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (trialEndDate) {
      const interval = setInterval(() => {
        calcularTempoRestante()
      }, 60000) // Atualiza a cada minuto

      return () => clearInterval(interval)
    }
  }, [trialEndDate])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Buscar dados do perfil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_start_date, trial_end_date, subscription_status')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }

      if (profile?.trial_end_date) {
        const endDate = new Date(profile.trial_end_date)
        setTrialEndDate(endDate)
        calcularTempoRestante(endDate)
      }

      // Se já tiver assinatura ativa, redirecionar para dashboard
      if (profile?.subscription_status === 'active') {
        router.push('/dashboard')
        return
      }

    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularTempoRestante = (endDate?: Date) => {
    const target = endDate || trialEndDate
    if (!target) return

    const now = new Date()
    const diff = target.getTime() - now.getTime()

    if (diff <= 0) {
      setDaysLeft(0)
      setHoursLeft(0)
      setMinutesLeft(0)
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    setDaysLeft(days)
    setHoursLeft(hours)
    setMinutesLeft(minutes)
  }

  const continuarParaApp = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFB800]/10 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          {/* Header com ícone */}
          <div className="bg-gradient-to-r from-[#FFB800] to-[#E5A600] px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo1.svg" 
                alt="PREPARADO" 
                className="h-16 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-black">
              Bem-vindo ao PREPARADO!
            </h1>
            <p className="text-black/80 mt-1">
              Sua jornada de preparação começa agora
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Contador de Trial */}
            <div className="text-center">
              <div className="inline-block bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-3">
                <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <Check size={14} />
                  Período de Teste Ativo
                </span>
              </div>
              
              <h2 className="text-lg font-bold text-gray-900">
                Experimente Grátis por 30 Dias
              </h2>
              
              <div className="mt-4 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-[#FFB800]">
                    {daysLeft}
                  </div>
                  <div className="text-xs text-gray-500">Dias</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-[#FFB800]">
                    {hoursLeft.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500">Horas</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-[#FFB800]">
                    {minutesLeft.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500">Minutos</div>
                </div>
              </div>

              {daysLeft <= 3 && daysLeft > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Seu período de teste está acabando! Aproveite ao máximo.
                  </p>
                </div>
              )}

              {daysLeft === 0 && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    Seu período de teste expirou. Assine agora para continuar usando!
                  </p>
                </div>
              )}
            </div>

            {/* Benefícios */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                O que você tem acesso:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-[#FFB800]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield size={14} className="text-[#FFB800]" />
                  </div>
                  <span>Checklist completo de preparação</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-[#FFB800]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-[#FFB800]" />
                  </div>
                  <span>Conexão com pessoas próximas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-[#FFB800]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap size={14} className="text-[#FFB800]" />
                  </div>
                  <span>Monitoramento de emergências em tempo real</span>
                </div>
              </div>
            </div>

            {/* Botão */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={continuarParaApp}
                className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {daysLeft > 0 ? (
                  <>
                    Começar a usar
                    <ArrowRight size={18} />
                  </>
                ) : (
                  'Assinar Agora'
                )}
              </button>

              {daysLeft > 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Após os {daysLeft} dias, você poderá assinar para continuar usando.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
            Pular por enquanto
          </Link>
          <span className="text-xs text-gray-300 mx-2">•</span>
          <Link href="/auth/login" className="text-xs text-gray-400 hover:text-gray-600">
            Sair
          </Link>
        </div>
      </div>
    </div>
  )
}