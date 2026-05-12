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

  const checkCheckinStatus = async (userId: string) => {
    const { data } = await supabase
      .from('checkin_answers')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
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

        {/* Botões de acesso rápido */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <a
            href="https://fmdiamante.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl text-center hover:from-purple-700 hover:to-indigo-700 transition shadow-sm"
          >
            <div className="text-2xl mb-1">📡</div>
            <div className="text-sm font-semibold">Rádio Diamante</div>
            <div className="text-xs opacity-90">Informações ao vivo</div>
          </a>

          <a
            href="https://www.painelglobal.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl text-center hover:from-blue-700 hover:to-cyan-700 transition shadow-sm"
          >
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-sm font-semibold">Painel Global</div>
            <div className="text-xs opacity-90">Monitoramento</div>
          </a>

          <a
            href="https://wa.me/?text=🚨 *PREPARADOS - COMUNICADO DE EMERGÊNCIA* 🚨%0A%0AAcionei o comunicador do aplicativo PREPARADOS.%0A%0APreciso de informações e orientações.%0A%0A*Favor retornar o contato.*"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl text-center hover:from-green-700 hover:to-emerald-700 transition shadow-sm"
          >
            <div className="text-2xl mb-1">💬</div>
            <div className="text-sm font-semibold">Comunicador Via Rádio</div>
            <div className="text-xs opacity-90">Canal de emergência</div>
          </a>
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

          <Link href="/catastrofes" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <div className="text-4xl mb-2">🌊</div>
            <h3 className="font-semibold text-gray-900">Catástrofes</h3>
            <p className="text-xs text-gray-500 mt-1">Orientação e rotas</p>
          </Link>
        </div>

       {/* Card do Painel Global com imagem estática */}
<div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-sm overflow-hidden mb-8 text-white">
  <div className="p-6 pb-0">
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <div className="text-5xl">🌍</div>
        <div>
          <h3 className="text-xl font-bold">Painel Global</h3>
          <p className="text-blue-100 text-sm mt-1">
            Monitoramento de placas tectônicas, vulcões e terremotos
          </p>
          <p className="text-blue-200 text-xs mt-2">
            Dados sísmicos em tempo real
          </p>
        </div>
      </div>
      <a
        href="https://www.painelglobal.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
      >
        Acessar Painel Global ao vivo
        <span className="text-lg">→</span>
      </a>
    </div>
  </div>
  
  {/* Imagem do mapa de monitoramento */}
  <div className="relative mt-4">
    <img
      src="/images/mapa-monitoramento.png"
      alt="Mapa de monitoramento global - Placas tectônicas, vulcões e terremotos"
      className="w-full h-auto object-cover"
      loading="lazy"
    />
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
      <p className="text-white text-xs text-center">
        🗺️ Mapa de monitoramento | Fonte: Painel Global
      </p>
    </div>
  </div>
  
  {/* Legenda rápida */}
  <div className="p-4 border-t border-white/20 bg-white/5">
    <div className="flex flex-wrap justify-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span>Vulcões Ativos</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span>Terremotos Recentes</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <span>Temperaturas</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border border-white/80"></div>
        <span>Placas Tectônicas</span>
      </div>
    </div>
  </div>
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