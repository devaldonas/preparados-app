'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadProfile(user.id)
        await loadProgress(user.id)
        await checkCheckinStatus(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, mochila_tipo')
      .eq('id', userId)
      .single()
    
    if (data && user) {
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: data.full_name, mochila_tipo: data.mochila_tipo } })
    }
  }

  const loadProgress = async (userId: string) => {
    // Buscar progresso do usuário
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', userId)

    const { data: allItems } = await supabase
      .from('checklist_items')
      .select('id')

    const total = allItems?.length || 0
    const completed = userProgress?.filter(item => item.completed).length || 0

    setTotalItems(total)
    setCompletedItems(completed)
    setProgress(total > 0 ? (completed / total) * 100 : 0)
  }

  // Função corrigida - sem erro de tipo
  const checkCheckinStatus = async (userId: string) => {
    const { data } = await supabase
      .from('checkin_answers')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    // Verificar se data existe e tem comprimento > 0
    const hasCheckin = data !== null && data.length > 0
    setCheckinCompleted(hasCheckin)
  }

  const getTipoLabel = () => {
    const tipo = user?.user_metadata?.mochila_tipo || 'BOB'
    if (tipo === 'EDC') return 'Every Day Carry (uso diário)'
    if (tipo === 'BOB') return 'Bug Out Bag (72h)'
    return 'Bug Out Long Term (longo período)'
  }

  const getTipoIcon = () => {
    const tipo = user?.user_metadata?.mochila_tipo || 'BOB'
    if (tipo === 'EDC') return '🎒'
    if (tipo === 'BOB') return '🎒⚡'
    return '⛰️'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header com saudação */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Olá, {user.user_metadata?.full_name || 'Preparado'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Continue sua jornada de preparação
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-lg">{getTipoIcon()}</span>
              <span className="text-sm font-medium">{getTipoLabel()}</span>
            </div>
          </div>
        </div>

        {/* Cards de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">Preparação Geral</span>
              <span className="text-green-700 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {completedItems} de {totalItems} itens na mochila
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🧠</span>
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium text-gray-900">
                  {checkinCompleted ? 'Diagnóstico realizado ✅' : 'Aguardando avaliação ⏳'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Principal - Cards de Acesso Rápido */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link 
            href="/check-in" 
            className={`bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition text-center ${!checkinCompleted ? 'ring-2 ring-green-500 ring-offset-2' : 'border-gray-100'}`}
          >
            <div className="text-4xl mb-2">🧠</div>
            <h3 className="font-semibold text-gray-900">Check-in</h3>
            <p className="text-xs text-gray-500 mt-1">
              {checkinCompleted ? 'Atualizar diagnóstico' : 'Iniciar avaliação'}
            </p>
          </Link>

          <Link href="/checklist" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <div className="text-4xl mb-2">🎒</div>
            <h3 className="font-semibold text-gray-900">Mochila</h3>
            <p className="text-xs text-gray-500 mt-1">Itens essenciais</p>
          </Link>

          <Link href="/pessoas" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="font-semibold text-gray-900">Pessoas Próximas</h3>
            <p className="text-xs text-gray-500 mt-1">Comunidade preparada</p>
          </Link>

          <Link href="/loja" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <div className="text-4xl mb-2">📦</div>
            <h3 className="font-semibold text-gray-900">Loja</h3>
            <p className="text-xs text-gray-500 mt-1">Produtos essenciais</p>
          </Link>
        </div>

        {/* Seção de Dicas */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-green-800 mb-1">Dica do dia</h3>
              <p className="text-sm text-green-700">
                "A maior arma de todas é a mente humana. Continue se preparando, 
                compartilhe sua localização para conectar-se com pessoas próximas 
                e ajude sua comunidade a estar preparada também!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}