'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RadioPlayer from '@/components/RadioPlayer'
import MapaMonitoramentoCompleto from '@/components/MapaMonitoramentoCompleto'
import GuiaPreparacaoCard from '@/components/GuiaPreparacaoCard'
import NavBar from '@/components/NavBar'


export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const router = useRouter()
  const [mostrarRadio, setMostrarRadio] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
      await checkAdminStatus(user.id)  // ← Adicionar esta linha
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

// Adicionar esta nova função
const checkAdminStatus = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') {
    setIsAdmin(true)
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

  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Preparado'
    return fullName.split(' ')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
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
        src="/logo1.svg" 
        alt="PREPARADO" 
        className="h-14 w-auto"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">
            Olá, {getFirstName(user.user_metadata?.full_name || 'Preparado')}!
          </h1>
          {isAdmin && (
            <Link
              href="/admin/produtos"
              className="bg-[#FFB800] text-black px-3 py-1 rounded-lg text-sm font-semibold hover:bg-[#E5A600] transition"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

{/* Cards de Progresso */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  
  {/* Card de Progresso */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="text-center">
      <p className="font-bold text-black text-lg">Você está</p>
      <div className="flex items-center justify-center gap-3 mt-1 mb-3">
        <span className="text-4xl font-bold text-[#FFB800]">
          {Math.round(progress)}%
        </span>
        <img 
          src="/images/preparado.png" 
          alt="PREPARADO" 
          className="h-4 w-auto"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#FFB800] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  </div>
  
  {/* Card Check-in */}
<Link 
  href="/check-in"
  className="bg-[#FFB800] rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group flex items-center justify-center"
>
  <div className="text-center">
    <p className="font-bold text-black text-xl">
      FIQUE 100%
    </p>
    
  </div>
</Link>
  
</div>

{/* Menu Principal - Cards de Acesso Rápido */}
<div className="grid grid-cols-2 gap-4 mb-8">
  <Link href="/pessoas" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
    <img 
      src="/images/pessoas-icon.png" 
      alt="Pessoas Próximas" 
      className="w-16 h-16 mx-auto mb-2 object-contain"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
    <h3 className="font-bold text-gray-900 text-base">Pessoas Próximas</h3>
    <p className="text-sm text-gray-500 mt-1">Comunidade preparada</p>
          </Link>

 <Link href="/mochilas" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <img 
              src="/images/mochila-icon.png" 
              alt="Mochila" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h3 className="font-bold text-gray-900 text-base">Mochila</h3>
            <p className="text-sm text-gray-500 mt-1">Itens essenciais</p>
          </Link>

<Link href="/catastrofes" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <img 
              src="/images/catastrofes-icon.jpeg" 
              alt="Catástrofes" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h3 className="font-bold text-gray-900 text-base">Catástrofes</h3>
            <p className="text-sm text-gray-500 mt-1">Orientação e rotas</p>
          </Link>

  {/* Comunicador Via Rádio */}
          <Link
            href="/comunicador/canal/8bfb8c3e-9fb0-4a43-a781-dc96b0a09baf"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center"
          >
            <img 
              src="/images/comunicador1-icon.png" 
              alt="Comunicador Via Rádio" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h3 className="font-bold text-gray-900 text-base">Comunicador Via Rádio</h3>
            <p className="text-sm text-gray-500 mt-1">PTT - Pressione para falar</p>
          </Link>
          
        
       
          <Link href="/loja" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
            <img 
              src="/images/loja-icon.png" 
              alt="Loja" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h3 className="font-bold text-gray-900 text-base">Loja</h3>
            <p className="text-sm text-gray-500 mt-1">Produtos essenciais</p>
          </Link>

          <button
  onClick={() => {
    const mensagem = encodeURIComponent(
      `Olá,\n\n` +
      `Estou usando o app PREPARADO e quero compartilhar com você.\n\n` +
      `É um aplicativo gratuito que auxilia na preparacao para emergencias.\n\n` +
      `O que voce encontra no PREPARADO:\n` +
      `• Checklist completo para sua mochila de emergencia\n` +
      `• Conexao com pessoas proximas e formacao de grupos\n` +
      `• Chat em tempo real com sua comunidade\n` +
      `• Guia completo para catastrofes (terremoto, tsunami, frio extremo)\n` +
      `• Dicas diarias de preparacao\n\n` +
      `Acesse: https://preparado.vercel.app\n\n` +
      `Vamos nos preparar juntos.`
    )
    window.open(`https://wa.me/?text=${mensagem}`, '_blank')
  }}
  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center group"
>
  <div className="w-16 h-16 mx-auto mb-2 rounded-xl flex items-center justify-center bg-white/20">
    {/* Aqui voce vai colocar seu icone personalizado */}
    <img 
      src="/images/indicar-amigo-icon.png" 
      alt="Indicar Amigo" 
      className="w-16 h-16 object-contain"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  </div>
  <h3 className="font-bold text-black text-base">Indique um Amigo</h3>
  <p className="text-sm text-gray/80 mt-1">Compartilhe o aplicativo</p>
</button>

        </div>

        
         {/* Rádio Diamante */}
        <div className="mb-8">
          <RadioPlayer 
            minimizado={false}
            onClose={() => setMostrarRadio(false)}
            integrado={true}
          />
        </div>

        {/* Mapa de Monitoramento Global com fundo preto */}
        <div className="mb-8">
          <div className="bg-black rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-xl">🌍</span> Monitoramento Global - Terremotos
              </h3>
            </div>
            <MapaMonitoramentoCompleto />
          </div>
        </div>

               {/* Seção de Dicas */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
          <div className="flex items-start gap-3">
            <img 
              src="/images/lampada.jpeg" 
              alt="Dica" 
              className="w-8 h-8 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Dica do dia</h3>
              <p className="text-sm text-gray-600">
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