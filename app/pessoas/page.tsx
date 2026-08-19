'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// 🔥 CARREGAR O MAPA DINAMICAMENTE
const MapaComClusters = dynamic(
  () => import('@/components/MapaComClusters'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }
)

import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface UserLocation {
  userId: string
  userName: string | null
  latitude: number
  longitude: number
  groupId: number | null
  cep: string
  mochila_tipo: string
  city: string | null
  state: string | null
}

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [totalPreparados, setTotalPreparados] = useState(0)
  const [userCep, setUserCep] = useState('')
  const [showGroupsList, setShowGroupsList] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
        await loadUserData(user.id)
        await loadUserLocations()
        await loadTotalPreparados()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  // 🔥 CORRIGIDO: loadUserData com as any
  const loadUserData = async (userId: string) => {
    try {
      const { data } = await (supabase
        .from('profiles') as any)
        .select('full_name, cep, latitude, longitude, mochila_tipo, city, state')
        .eq('id', userId)
        .maybeSingle()
      
      if (data) {
        setUserCep(data.cep || '')
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  // 🔥 CORRIGIDO: loadUserLocations com as any
  const loadUserLocations = async () => {
    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, cep, latitude, longitude, mochila_tipo, group_id, city, state')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) {
        console.error('Erro ao buscar localizações:', error)
        setUserLocations([])
        return
      }

      if (data && data.length > 0) {
        setUserLocations(data.map((p: any) => ({
          userId: p.id,
          userName: p.full_name,
          latitude: p.latitude,
          longitude: p.longitude,
          groupId: p.group_id,
          cep: p.cep || '',
          mochila_tipo: p.mochila_tipo || 'BOB',
          city: p.city || null,
          state: p.state || null
        })))
      } else {
        setUserLocations([])
      }
    } catch (error) {
      console.error('Erro ao carregar localizações:', error)
      setUserLocations([])
    }
  }

  // 🔥 CORRIGIDO: loadTotalPreparados com as any
  const loadTotalPreparados = async () => {
    try {
      const { count, error } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('Erro ao contar preparados:', error)
        setTotalPreparados(0)
        return
      }
      
      if (count !== null) {
        setTotalPreparados(count)
      }
    } catch (error) {
      console.error('Erro ao carregar total:', error)
      setTotalPreparados(0)
    }
  }

  // 🔥 CORRIGIDO: atualizarCep com as any
  const atualizarCep = async () => {
    const novoCep = prompt('Digite seu CEP para encontrar pessoas próximas:', userCep)
    if (novoCep && novoCep.length >= 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${novoCep.replace(/\D/g, '')}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          await (supabase
            .from('profiles') as any)
            .update({ 
              cep: novoCep,
              city: data.localidade,
              state: data.uf
            })
            .eq('id', user.id)
          setUserCep(novoCep)
          await loadUserLocations()
        } else {
          alert('CEP não encontrado')
        }
      } catch (error) {
        alert('Erro ao buscar CEP')
      }
    }
  }

  // 🔥 CORRIGIDO: abrirChatDoGrupo com as any
  const abrirChatDoGrupo = async (userId: string) => {
    try {
      const { data: profile, error } = await (supabase
        .from('profiles') as any)
        .select('group_id')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar grupo do usuário:', error)
        alert('Erro ao buscar informações do usuário')
        return
      }

      if (profile?.group_id) {
        router.push(`/grupo/${profile.group_id}`)
      } else {
        router.push('/grupo')
      }
    } catch (error) {
      console.error('Erro ao abrir chat:', error)
      alert('Erro ao abrir o chat. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img 
            src="/images/pessoas1-icon.png" 
            alt="Pessoas Próximas" 
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-black mb-2">PESSOAS PRÓXIMAS</h1>
          <p className="text-gray-600">
            Conecte-se com pessoas que também estão se preparando
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold text-[#FFB800]">{userLocations.length}</div>
            <p className="text-sm text-gray-600">Preparados no mapa</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold text-[#FFB800]">{totalPreparados}</div>
            <p className="text-sm text-gray-600">Total de Preparados</p>
          </div>
          <button
            onClick={() => setShowGroupsList(!showGroupsList)}
            className="bg-[#FFB800] rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition flex flex-col items-center justify-center"
          >
            <p className="text-sm text-black font-medium">
              {showGroupsList ? 'Ocultar Grupos' : 'Ver Grupos'}
            </p>
          </button>
        </div>

        <div className="mb-6">
          <MapaComClusters 
            userLocations={userLocations}
            showGroupsList={showGroupsList}
            onUserSelect={abrirChatDoGrupo}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-600">CEP cadastrado</p>
              <p className="font-semibold text-black">{userCep || 'Não informado'}</p>
            </div>
            <button
              onClick={atualizarCep}
              className="bg-[#FFB800] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E5A600] transition"
            >
              Informar meu CEP
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/dashboard"
            className="text-center bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition h-9 flex items-center justify-center"
          >
            Voltar ao Início
          </Link>

          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}