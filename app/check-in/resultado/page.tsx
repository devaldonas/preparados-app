'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Componente interno que usa useSearchParams
function ResultadoContent() {
  const [user, setUser] = useState<any>(null)
  const [mochilaTipo, setMochilaTipo] = useState('BOB')
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const score = parseInt(searchParams.get('score') || '0')
  const maxScore = parseInt(searchParams.get('max') || '90')
  const percentage = parseInt(searchParams.get('percentage') || '0')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadProfile(user.id)
        await checkCheckinStatus(user.id)
      }
    }
    getUser()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('mochila_tipo')
      .eq('id', userId)
      .single()
    
    if (data) {
      setMochilaTipo(data.mochila_tipo)
    }
  }

  const checkCheckinStatus = async (userId: string) => {
    const { data } = await supabase
      .from('checkin_answers')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    const hasCheckin = data !== null && data.length > 0
    setCheckinCompleted(hasCheckin)
  }

  const getClassification = () => {
    if (percentage >= 80) return { text: 'PREPARADO', color: 'text-black' }
    if (percentage >= 50) return { text: 'PREPARANDO', color: 'text-black' }
    return { text: 'INICIANTE', color: 'text-black' }
  }

  const getRecommendation = () => {
    if (percentage >= 80) return 'Continue mantendo sua mochila atualizada!'
    if (percentage >= 50) return 'Você está no caminho certo. Foque nos itens que faltam.'
    return 'Comece montando sua mochila básica. Veja os itens essenciais no checklist.'
  }

  const classification = getClassification()
  const isPreparado = percentage >= 80

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">SEU RESULTADO</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          {isPreparado ? (
            <>
              <img 
                src="/logoprep.png" 
                alt="Preparado" 
                className="w-24 h-24 mx-auto mb-4 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <h2 className="text-2xl font-bold text-black mb-4">
                PARABÉNS! CONTINUE EVOLUINDO
              </h2>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-[#FFB800] h-4 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pontuação: {score} de {maxScore} ({percentage}%)
                </p>
              </div>
              <p className="text-gray-700 mb-6">
                {getRecommendation()}
              </p>
            </>
          ) : (
            <>
              <img 
                src="/images/mochila-icon.png" 
                alt="Complete sua mochila" 
                className="w-24 h-24 mx-auto mb-4 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                COMPLETE SUA MOCHILA
              </h2>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-[#FFB800] h-4 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pontuação: {score} de {maxScore} ({percentage}%)
                </p>
              </div>
              <p className="text-gray-700 mb-6">
                {getRecommendation()}
              </p>
            </>
          )}

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-4">
              {mochilaTipo === 'EDC' && 'Seu perfil: Every Day Carry (uso diário)'}
              {mochilaTipo === 'BOB' && 'Seu perfil: Bug Out Bag (72h)'}
              {mochilaTipo === 'BOLT' && 'Seu perfil: Bug Out Long Term (longo período)'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/checklist"
            className="flex-1 bg-[#FFB800] text-black py-3 px-4 rounded-lg font-semibold text-center hover:bg-[#E5A600] transition"
          >
            Ver Checklist
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-gray-800 transition"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Suspense
export default function Resultado() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando resultado...</div>}>
      <ResultadoContent />
    </Suspense>
  )
}