'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface PreparometroProps {
  userId: string
}

interface CheckinAnswer {
  score: number
}

interface UserBackpack {
  progress: number
}

export default function Preparometro({ userId }: PreparometroProps) {
  const [checkInProgress, setCheckInProgress] = useState(0)
  const [mochilasProgress, setMochilasProgress] = useState<UserBackpack[]>([])
  const [totalProgress, setTotalProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarProgresso()
  }, [userId])

  const carregarProgresso = async () => {
    try {
      setLoading(true)

      // 1. Buscar check-in
      const { data: checkinData, error: checkinError } = await supabase
        .from('checkin_answers')
        .select('score')
        .eq('user_id', userId)

      if (checkinError) {
        console.error('Erro ao buscar check-in:', checkinError)
        setLoading(false)
        return
      }

      const totalCheckin = checkinData?.length || 0
      const totalScore = checkinData?.reduce((acc: number, curr: CheckinAnswer) => acc + (curr.score || 0), 0) || 0
      const checkInPercent = totalCheckin > 0 ? Math.round((totalScore / (totalCheckin * 5)) * 100) : 0
      setCheckInProgress(checkInPercent)

      // 2. Buscar mochilas
      const { data: mochilas, error: mochilasError } = await supabase
        .from('user_backpacks')
        .select('progress')
        .eq('user_id', userId)

      if (mochilasError) {
        console.error('Erro ao buscar mochilas:', mochilasError)
        setLoading(false)
        return
      }

      const mochilasData = mochilas || []
      setMochilasProgress(mochilasData)

      // 3. Calcular progresso total (NUNCA PASSA DE 100%)
      const mochilasValidas = mochilasData.filter((m: UserBackpack) => m.progress > 0)
      const mediaMochilas = mochilasValidas.length > 0
        ? mochilasValidas.reduce((acc: number, m: UserBackpack) => acc + m.progress, 0) / mochilasValidas.length
        : 0

      // PESO: 50% check-in + 50% mochilas
      const total = (checkInPercent * 0.5) + (mediaMochilas * 0.5)
      const progressoFinal = Math.min(Math.round(total), 100) // NUNCA > 100%
      
      setTotalProgress(progressoFinal)

    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Preparômetro</h3>
        <span className="text-2xl font-bold text-[#FFB800]">{totalProgress}%</span>
      </div>
      
      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className="bg-[#FFB800] h-3 rounded-full transition-all duration-500"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Check-in</p>
          <p className="font-semibold">{checkInProgress}%</p>
        </div>
        <div>
          <p className="text-gray-500">Mochilas</p>
          <p className="font-semibold">
            {mochilasProgress.length > 0 
              ? Math.round(mochilasProgress.reduce((acc: number, m: UserBackpack) => acc + m.progress, 0) / mochilasProgress.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {totalProgress === 100 
            ? '🎉 Você está 100% preparado!' 
            : totalProgress >= 70 
              ? '👍 Bom progresso! Continue assim!'
              : totalProgress >= 40
                ? '📝 Continue montando sua mochila!'
                : '🎒 Comece sua preparação agora!'}
        </p>
      </div>
    </div>
  )
}
