'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RadioPlayer from '@/components/RadioPlayer'
import MapaMonitoramentoCompleto from '@/components/MapaMonitoramentoCompleto'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const router = useRouter()
  const [mostrarRadio, setMostrarRadio] = useState(true)

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
        {/* Header com saudação e logo */}
<div className="mb-8">
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-3">
      <img 
        src="/logo.svg" 
        alt="PREPARADOS" 
        className="h-10 w-auto"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div>
        <h1 className="text-3xl font-bold text-preparados-blue">
          Olá, {user.user_metadata?.full_name || 'Preparado'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Continue sua jornada de preparação
        </p>
      </div>
    </div>
    <div className="bg-preparados-yellow text-preparados-blue px-4 py-2 rounded-full flex items-center gap-2">
      <span className="text-lg">{getTipoIcon()}</span>
      <span className="text-sm font-medium">{getTipoLabel()}</span>
    </div>
  </div>
</div>

        {/* Player da Rádio Diamante integrado no topo */}
        <div className="mb-8">
          <RadioPlayer 
            minimizado={false}
            onClose={() => setMostrarRadio(false)}
            integrado={true}
          />
        </div>

{/* Botões de acesso rápido */}
<div className="grid grid-cols-1 gap-3 mb-8">
  <Link
  href="/comunicador/canal/8bfb8c3e-9fb0-4a43-a781-dc96b0a09baf"
  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 rounded-lg text-center hover:from-blue-700 hover:to-cyan-700 transition shadow-sm"
>
  <div className="text-xl mb-1">🎙️</div>
  <div className="text-xs font-semibold">Comunicador Via Rádio</div>
  <div className="text-[10px] opacity-90">PTT - Pressione para falar</div>
</Link>

</div>

        {/* Cards de Progresso */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-gray-500 text-sm">Preparação Geral</span>
      <span className="text-preparados-blue font-bold text-lg">{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-preparados-blue h-2.5 rounded-full transition-all duration-500"
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
    <img 
      src="/images/checkin-icon.png" 
      alt="Check-in" 
      className="w-12 h-12 mx-auto mb-2 object-contain"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
    <h3 className="font-semibold text-gray-900">Check-in</h3>
    <p className="text-xs text-gray-500 mt-1">
      {checkinCompleted ? 'Atualizar diagnóstico' : 'Iniciar avaliação'}
    </p>
  </Link>

  <Link href="/checklist" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
    <img 
      src="/images/mochila-icon.png" 
      alt="Mochila" 
      className="w-12 h-12 mx-auto mb-2 object-contain"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
    <h3 className="font-semibold text-gray-900">Mochila</h3>
    <p className="text-xs text-gray-500 mt-1">Itens essenciais</p>
  </Link>

  <Link href="/pessoas" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
    <img 
      src="/images/pessoas-icon.png" 
      alt="Pessoas Próximas" 
      className="w-12 h-12 mx-auto mb-2 object-contain"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
    <h3 className="font-semibold text-gray-900">Pessoas Próximas</h3>
    <p className="text-xs text-gray-500 mt-1">Comunidade preparada</p>
  </Link>

 <Link href="/loja" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
  <img 
    src="/images/loja-icon.jpeg" 
    alt="Loja" 
    className="w-12 h-12 mx-auto mb-2 object-contain"
    onError={(e) => { e.currentTarget.style.display = 'none' }}
  />
  <h3 className="font-semibold text-gray-900">Loja</h3>
  <p className="text-xs text-gray-500 mt-1">Produtos essenciais</p>
</Link>

  <Link href="/catastrofes" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
  <img 
    src="/images/catastrofes-icon.jpeg" 
    alt="Catástrofes" 
    className="w-12 h-12 mx-auto mb-2 object-contain"
    onError={(e) => { e.currentTarget.style.display = 'none' }}
  />
  <h3 className="font-semibold text-gray-900">Catástrofes</h3>
  <p className="text-xs text-gray-500 mt-1">Orientação e rotas</p>
</Link>

  {/* Card do Ecossistema Dakila com imagem de fundo */}
  <a
    href="https://www.dakila.com.br"
    target="_blank"
    rel="noopener noreferrer"
    className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-xl shadow-sm border hover:shadow-md transition text-center group"
  >
    <div 
      className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition"
      style={{ backgroundImage: "url('/images/dakila/dakila-slide1.png')" }}
    />
    <div className="relative z-10">
      <div className="text-4xl mb-2">🌍</div>
      <h3 className="font-semibold">Ecossistema Dakila</h3>
      <p className="text-xs text-white/80 mt-1">Ciência e tecnologia</p>
    </div>
  </a>
</div>

        {/* Mapa de Monitoramento Global */}
        <div className="mb-8">
          <MapaMonitoramentoCompleto />
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
