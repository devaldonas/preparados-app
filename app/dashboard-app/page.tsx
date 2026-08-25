'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import Link from 'next/link'
import RadioPlayer from '@/components/RadioPlayer'
import MapaMonitoramentoCompleto from '@/components/MapaMonitoramentoCompleto'
import MentoriaCard from '@/components/MentoriaCard'

export default function DashboardApp() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const [mostrarRadio, setMostrarRadio] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_status, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError)
          return
        }

        if (profile?.role === 'admin') {
          setIsAdmin(true)
          await loadProfile(user.id)
          await loadProgress(user.id)
          await checkCheckinStatus(user.id)
          setLoading(false)
          return
        }

        await loadProfile(user.id)
        await loadProgress(user.id)
        await checkCheckinStatus(user.id)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadProgress(user.id)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, mochila_tipo, city, state, role')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar perfil:', error)
        return
      }

      if (data) {
        setProfile(data)
        if (data.role === 'admin') {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const loadProgress = async (userId: string) => {
    try {
      const { data: checkinData, error: checkinError } = await supabase
        .from('checkin_answers')
        .select('score')
        .eq('user_id', userId)

      if (checkinError) {
        console.error('Erro ao carregar check-in:', checkinError)
        setProgress(0)
        return
      }

      const maxScore = 90
      const totalScore = checkinData?.reduce((sum: number, item: any) => sum + (item.score || 0), 0) || 0
      const checkinPercent = Math.min(Math.round((totalScore / maxScore) * 100), 100)
      
      console.log('📊 Check-in:', checkinPercent + '%')

      const { data: mochilas, error: mochilasError } = await supabase
        .from('user_backpacks')
        .select('progress')
        .eq('user_id', userId)

      if (mochilasError) {
        console.error('Erro ao carregar mochilas:', mochilasError)
        setProgress(checkinPercent)
        return
      }

      let mochilaPercent = 0
      if (mochilas && mochilas.length > 0) {
        const totalMochilaProgress = mochilas.reduce((sum: number, m: any) => sum + (m.progress || 0), 0)
        mochilaPercent = Math.round(totalMochilaProgress / mochilas.length)
      }
      
      console.log('📊 Média das mochilas:', mochilaPercent + '%')

      const totalProgress = Math.min(Math.round((checkinPercent + mochilaPercent) / 2), 100)
      
      console.log('📊 Progresso Total:', totalProgress + '%')

      setProgress(totalProgress)

    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
      setProgress(0)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-center">
              <p className="font-bold text-black text-xl">Você está</p>
              <div className="flex items-center justify-center gap-3 mt-1 mb-3">
                <span className="text-2xl font-bold text-[#FFB800]">
                  {progress}%
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
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          <Link 
            href="/check-in"
            className="bg-[#FFB800] rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group flex items-center justify-center"
          >
            <div className="text-center">
              <p className="font-bold text-black text-xl">PREPARÔMETRO</p>
            </div>
          </Link>
          
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

          <Link
            href="/pessoas"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/pessoas1-icon.png"
                alt="Comunidade"
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Comunidade
            </h3>
          </Link>

          <Link
            href="/mochilas"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/mochila-icon.png"
                alt="Mochila"
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Mochila
            </h3>
          </Link>

          <Link
            href="/catastrofes"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/catastrofes-icon.png"
                alt="Catastrofes"
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Catastrofes
            </h3>
          </Link>

          <MentoriaCard isLive={false} nextEvent="Domingo 19h" />

          <Link
            href="/loja"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/loja-icon.png"
                alt="Loja"
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Loja
            </h3>
          </Link>

          <Link
            href="/primeiros-socorros"
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px] cursor-pointer hover:border-[#FFB800] group relative overflow-hidden"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/images/primeiros-socorros.jpeg"
                alt="Primeiros Socorros"
                className="w-16 h-16 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
            <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
              Primeiros Socorros
            </h3>
          </Link>

        </div>

        <div className="mb-8">
          <RadioPlayer 
            minimizado={false}
            onClose={() => setMostrarRadio(false)}
            integrado={true}
          />
        </div>

        <div className="mb-8">
          <div className="bg-black rounded-xl overflow-hidden">
            <div className="p-1 border-b border-[#FFB800]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-xl">📍</span> Monitoramento Global - Terremotos
              </h3>
            </div>
            <MapaMonitoramentoCompleto />
          </div>
        </div>

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
                compartilhe sua localizacao para conectar-se com pessoas proximas 
                e ajude sua comunidade a estar preparada tambem!"
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
