'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
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

interface GrupoMapa {
  id: number
  name: string
  city_name: string
  member_count: number
  center_latitude: number
  center_longitude: number
}

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [gruposMapa, setGruposMapa] = useState<GrupoMapa[]>([])
  const [totalUsuariosMapa, setTotalUsuariosMapa] = useState(0)
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
        await loadGruposMapa()
        await loadGroupsCount()
        await loadTotalUsuariosMapa()
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

  const loadGruposMapa = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, city_name, member_count, center_latitude, center_longitude')
        .gt('member_count', 0)
        .order('member_count', { ascending: false })

      if (error) {
        console.error('Erro ao buscar grupos:', error)
        setGruposMapa([])
        return
      }

      // Filtra grupos com coordenadas válidas e membros > 0
      const gruposValidos = (data || []).filter((g: any) => {
        if (g.name === 'Localização do Usuário') return false
        if (g.name === 'Localizacao do Usuario') return false
        if (g.name === 'Sem grupo') return false
        if (g.name === 'Sem cidade definida') return false
        if (g.member_count === 0) return false
        if (!g.center_latitude || !g.center_longitude) return false
        return true
      })

      const gruposMapeados: GrupoMapa[] = gruposValidos.map((g: any) => ({
        id: g.id,
        name: g.name,
        city_name: g.city_name || g.name,
        member_count: g.member_count || 0,
        center_latitude: g.center_latitude,
        center_longitude: g.center_longitude
      }))

      setGruposMapa(gruposMapeados)
      console.log(`✅ ${gruposMapeados.length} grupos carregados no mapa`)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
      setGruposMapa([])
    }
  }

  const loadGroupsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, member_count')
      
      if (error) {
        console.error('Erro ao contar grupos:', error)
        setGroupsCount(0)
        return
      }
      
      // Mesmo filtro da página de grupos
      const gruposValidos = (data || []).filter((g: any) => {
        if (g.name === 'Localização do Usuário') return false
        if (g.name === 'Localizacao do Usuario') return false
        if (g.name === 'Sem grupo') return false
        if (g.name === 'Sem cidade definida') return false
        if (g.member_count === 0) return false
        return true
      })
      
      setGroupsCount(gruposValidos.length)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
      setGroupsCount(0)
    }
  }

  const loadTotalUsuariosMapa = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) {
        console.error('Erro ao contar usuários no mapa:', error)
        setTotalUsuariosMapa(0)
        return
      }

      setTotalUsuariosMapa(count || 0)
    } catch (error) {
      console.error('Erro ao contar usuários no mapa:', error)
      setTotalUsuariosMapa(0)
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

  const entrarNoGrupo = (groupId: number) => {
    router.push(`/grupo/${groupId}`)
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
          </div>
          <button
            onClick={compartilharLocalizacao}
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >

            Compartilhar localização
          </button>
        </div>

        {/* 🔥 CARDS - APENAS 2 COM ÍCONES */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Card: Preparados */}
          <Link
            href="/pessoas/usuarios"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex flex-col h-full min-h-[88px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/images/markmap.png" 
                  alt="Preparados" 
                  className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 leading-tight">Preparados</p>
                <p className="text-xl font-bold text-black mt-1">{totalUsuariosMapa}</p>
              </div>
            </div>
          </Link>

          {/* Card: Ver Grupos */}
          <Link
            href="/pessoas/grupos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex flex-col h-full min-h-[88px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/images/pessoas1-icon.png" 
                  alt="Grupos" 
                  className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 leading-tight">Grupos</p>
                <p className="text-xl font-bold text-black mt-1">{groupsCount}</p>
              </div>
            </div>
          </Link>

        </div>

        {/* Texto centralizado */}
        <p className="text-sm text-gray-500 text-center mb-4">
          Conecte-se com pessoas da sua região
        </p>

        {/* Mapa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-center">Mapa de Pessoas Próximas</h2>
          </div>
          <div className="h-[400px]">
            <MapaComClusters 
              grupos={gruposMapa}
              onEntrarNoChat={entrarNoGrupo}
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
                      await loadGruposMapa()
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
