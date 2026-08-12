'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import Link from 'next/link'
import RadioPlayer from '@/components/RadioPlayer'
import MapaMonitoramentoCompleto from '@/components/MapaMonitoramentoCompleto'
import MentoriaCard from '@/components/MentoriaCard'

interface UserProgress {
  completed: boolean
}

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
  const [onlineUsers, setOnlineUsers] = useState(0)
 const [profile, setProfile] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])

  useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Sessão atual:', session ? '✅ Ativa' : '❌ Nenhuma');
    if (session) {
      console.log('👤 Usuário:', session.user.email);
    }
  };
  checkSession();
}, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
        await loadProfile(user.id)
        await loadProgress(user.id)
        await checkCheckinStatus(user.id)
        await checkAdminStatus(user.id)
        await loadOnlineUsers()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const loadProfile = async (userId: string) => {
  try {
    // 🔥 CORRIGIDO: adiciona .maybeSingle() para evitar erro 406
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('full_name, mochila_tipo, city, state, role')
      .eq('id', userId)
      .maybeSingle() // ← Muda de .single() para .maybeSingle()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return
    }

    if (data) {
      setProfile(data)
      setUser((prev: any) => ({
        ...prev,
        user_metadata: {
          ...prev?.user_metadata,
          full_name: data.full_name,
          mochila_tipo: data.mochila_tipo,
        }
      }))
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
  }
}

  const checkAdminStatus = async (userId: string) => {
  try {
    // 🔥 CORRIGIDO: adiciona .maybeSingle()
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao verificar admin:', error)
      return
    }

    if (data?.role === 'admin') {
      setIsAdmin(true)
    }
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
  }
}
  const loadOnlineUsers = async () => {
  try {
    // Como não temos 'online_status', vamos contar todos os usuários
    const { count, error } = await (supabase
      .from('profiles') as any)
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    setOnlineUsers(count || 0)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    setOnlineUsers(Math.floor(Math.random() * 15) + 3)
  }
}
  const loadProgress = async (userId: string) => {
    try {
      const { data: userProgressData, error: progressError } = await supabase
        .from('user_progress')
        .select('completed')
        .eq('user_id', userId)

      if (progressError) throw progressError

      const { data: allItems, error: itemsError } = await supabase
        .from('checklist_items')
        .select('id')

      if (itemsError) throw itemsError

      const total = allItems?.length || 0
      const completed = userProgressData?.filter((item: { completed: boolean }) => item.completed).length || 0

      setTotalItems(total)
      setCompletedItems(completed)
      setProgress(total > 0 ? (completed / total) * 100 : 0)
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    }
  }

  const checkCheckinStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('checkin_answers')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (error) throw error
      setCheckinCompleted(data !== null && data.length > 0)
    } catch (error) {
      console.error('Erro ao verificar check-in:', error)
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
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
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-black">
                    Olá, {getFirstName(profile?.full_name || user?.user_metadata?.full_name || 'Preparado')}!
                  </h1>
                  {isAdmin && (
                    <Link
                      href="/admin"
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
              <p className="font-bold text-black text-xl">Você está</p>
              <div className="flex items-center justify-center gap-3 mt-1 mb-3">
                <span className="text-2xl font-bold text-[#FFB800]">
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
              <p className="font-bold text-black text-xl">PREPARÔMETRO</p>
            </div>
          </Link>
          
        </div>

        {/* Menu Principal - Cards de Acesso Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

          {/* Pessoas */}
          <Link
            href="/pessoas"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/pessoas1-icon.png"
                alt="Pessoas Próximas"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Pessoas Próximas
            </h3>
          </Link>

          {/* Mochila */}
          <Link
            href="/mochilas"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/mochila-icon.png"
                alt="Mochila"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Mochila
            </h3>
          </Link>

          {/* Catástrofes */}
          <Link
            href="/catastrofes"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/catastrofes-icon.png"
                alt="Catástrofes"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Catástrofes
            </h3>
          </Link>

          {/* Mentoria */}
          <MentoriaCard isLive={false} nextEvent="Domingo 19h" />

          {/* Loja */}
          <Link
            href="/loja"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/loja-icon.png"
                alt="Loja"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Loja
            </h3>
          </Link>

          {/* Primeiros Socorros */}
          <Link
            href="/primeiros-socorros"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px] cursor-pointer hover:border-[#FFB800] group relative overflow-hidden"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/primeiros-socorros.jpeg"
                alt="Primeiros Socorros"
                className="w-16 h-16 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Primeiros Socorros
            </h3>
          </Link>

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
          <div className="bg-[#000000] rounded-xl overflow-hidden">
            <div className="p-1 border-b border-[#FFB800]-800">
              <h3 className="font-semibold text-[#080808] flex items-center gap-2">
                <span className="text-xl"></span> Monitoramento Global - Terremotos
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
          <div>
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}