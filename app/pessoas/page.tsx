'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Users, MapPin } from 'lucide-react'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

// CARREGAR O MAPA DINAMICAMENTE
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
  const [groupsCount, setGroupsCount] = useState(0)
  const [userCep, setUserCep] = useState('')
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
        await loadGroupsCount()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
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

  const loadUserLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
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

  const loadGroupsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('Erro ao contar grupos:', error)
        setGroupsCount(0)
        return
      }
      
      if (count !== null) {
        setGroupsCount(count)
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
      setGroupsCount(0)
    }
  }

  const compartilharLocalizacao = async () => {
    if (!user) return

    try {
      if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          const { error } = await supabase
            .from('profiles')
            .update({
              latitude,
              longitude,
              last_location_update: new Date().toISOString()
            })
            .eq('id', user.id)

          if (error) {
            console.error('Erro ao salvar localização:', error)
            alert('Erro ao salvar localização')
          } else {
            alert('Localização compartilhada com sucesso!')
            window.location.reload()
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          alert('Erro ao obter localização. Verifique as permissões do navegador.')
        }
      )
    } catch (error) {
      console.error('Erro ao compartilhar localização:', error)
      alert('Erro ao compartilhar localização')
    }
  }

  const abrirChatDoGrupo = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
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
        router.push('/pessoas/grupos')
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
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Pessoas Próximas</h1>
            <p className="text-sm text-gray-500">Conecte-se com pessoas da sua região</p>
          </div>
          <button
            onClick={compartilharLocalizacao}
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >
            <MapPin size={18} />
            Compartilhar localização
          </button>
        </div>

        {/* 🔥 CARDS - APENAS 2 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Card: Preparados no Mapa */}
          <Link
            href="/pessoas/usuarios"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFB800]/10 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-[#FFB800]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Preparados no Mapa</p>
                <p className="text-xl font-bold text-black">{userLocations.length}</p>
              </div>
            </div>
          </Link>

          {/* Card: Ver Grupos */}
          <Link
            href="/pessoas/grupos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Grupos</p>
                <p className="text-xl font-bold text-black">{groupsCount}</p>
              </div>
            </div>
          </Link>

        </div>

        {/* Mapa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Mapa de Pessoas Próximas</h2>
          </div>
          <div className="h-[400px]">
            <MapaComClusters 
              userLocations={userLocations}
              onUserSelect={abrirChatDoGrupo}
            />
          </div>
        </div>

        {/* CEP */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-600">CEP cadastrado</p>
              <p className="font-semibold text-black">{userCep || 'Não informado'}</p>
            </div>
            <button
              onClick={async () => {
                const novoCep = prompt('Digite seu CEP para encontrar pessoas próximas:', userCep)
                if (novoCep && novoCep.length >= 8) {
                  try {
                    const response = await fetch(`https://viacep.com.br/ws/${novoCep.replace(/\D/g, '')}/json/`)
                    const data = await response.json()
                    
                    if (!data.erro) {
                      await supabase
                        .from('profiles')
                        .update({ 
                          cep: novoCep,
                          city: data.localidade,
                          state: data.uf
                        })
                        .eq('id', user.id)
                      setUserCep(novoCep)
                      await loadUserLocations()
                      alert('CEP atualizado com sucesso!')
                    } else {
                      alert('CEP não encontrado')
                    }
                  } catch (error) {
                    alert('Erro ao buscar CEP')
                  }
                }
              }}
              className="bg-[#FFB800] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E5A600] transition"
            >
              Informar meu CEP
            </button>
          </div>
        </div>

        {/* Botão Indique um Amigo */}
        <div>
          <BotaoIndicarAmigo />
        </div>

        {/* Voltar ao Início */}
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="block text-center bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar ao Início
          </Link>
        </div>

      </div>
    </div>
  )
}
