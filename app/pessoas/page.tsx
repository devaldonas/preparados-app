'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PessoaProxima {
  id: string
  full_name: string
  latitude: number
  longitude: number
  distance: number
  last_seen: string
  mochila_tipo: string
}

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [pessoas, setPessoas] = useState<PessoaProxima[]>([])
  const [error, setError] = useState('')
  const [sharingLocation, setSharingLocation] = useState(false)
  const [radius, setRadius] = useState(10) // km
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadUserLocation(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadUserLocation = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', userId)
      .single()
    
    if (data && data.latitude && data.longitude) {
      setLocation({ lat: data.latitude, lng: data.longitude })
      await buscarPessoasProximas(data.latitude, data.longitude)
    }
  }

  const getCurrentLocation = () => {
    setError('')
    setSharingLocation(true)

    if (!navigator.geolocation) {
      setError('Seu navegador não suporta geolocalização')
      setSharingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        
        // Salvar localização no perfil do usuário
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              latitude, 
              longitude,
              last_location_update: new Date().toISOString()
            })
            .eq('id', user.id)
        }
        
        await buscarPessoasProximas(latitude, longitude)
        setSharingLocation(false)
      },
      (err) => {
        console.error('Erro ao obter localização:', err)
        setError('Não foi possível obter sua localização. Verifique as permissões.')
        setSharingLocation(false)
      }
    )
  }

  const buscarPessoasProximas = async (lat: number, lng: number) => {
    setLoading(true)
    
    // Buscar outros usuários com localização
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, latitude, longitude, mochila_tipo, last_location_update')
      .not('id', 'eq', user.id) // excluir o próprio usuário
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    
    if (error) {
      console.error('Erro ao buscar pessoas:', error)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      // Calcular distância para cada pessoa
      const pessoasComDistancia = data.map((pessoa) => {
        const distance = calcularDistancia(lat, lng, pessoa.latitude, pessoa.longitude)
        return {
          ...pessoa,
          distance,
          last_seen: pessoa.last_location_update,
        }
      })
      
      // Filtrar por raio e ordenar por distância
      const pessoasProximas = pessoasComDistancia
        .filter(p => p.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20) // limite de 20 pessoas
      
      setPessoas(pessoasProximas)
    } else {
      setPessoas([])
    }
    setLoading(false)
  }

  // Fórmula de Haversine para calcular distância em km entre dois pontos
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c * 10) / 10
  }

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'EDC') return 'Every Day Carry'
    if (tipo === 'BOB') return 'Bug Out Bag (72h)'
    return 'Bug Out Long Term'
  }

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'EDC') return '🎒'
    if (tipo === 'BOB') return '🎒⚡'
    return '⛰️'
  }

  if (loading && !location) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">🗺️ PESSOAS PRÓXIMAS</h1>
          <p className="text-gray-600">
            Conecte-se com pessoas que também estão se preparando
          </p>
        </div>

        {/* Botão de localização */}
        {!location && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-xl font-semibold mb-4">Compartilhe sua localização</h2>
            <p className="text-gray-600 mb-6">
              Para encontrar pessoas preparadas perto de você, precisamos saber sua localização.
              Sua privacidade é respeitada - apenas a distância aproximada será compartilhada.
            </p>
            <button
              onClick={getCurrentLocation}
              disabled={sharingLocation}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {sharingLocation ? 'Obtendo localização...' : '📍 Compartilhar minha localização'}
            </button>
            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}
          </div>
        )}

        {/* Seletor de raio */}
        {location && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm text-gray-600">Raio de busca</p>
                  <p className="font-semibold text-green-700">{radius} km</p>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => {
                  setRadius(parseInt(e.target.value))
                  if (location) {
                    buscarPessoasProximas(location.lat, location.lng)
                  }
                }}
                className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <button
                onClick={() => buscarPessoasProximas(location.lat, location.lng)}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                ↻ Atualizar
              </button>
            </div>
          </div>
        )}

        {/* Lista de pessoas próximas */}
        {location && (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                {loading ? (
                  'Buscando pessoas próximas...'
                ) : (
                  `${pessoas.length} pessoa(s) se preparando num raio de ${radius} km`
                )}
              </p>
            </div>

            {!loading && pessoas.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa encontrada</h3>
                <p className="text-gray-500 text-sm">
                  Nenhuma pessoa se preparando foi encontrada num raio de {radius} km.
                  {radius < 20 ? ' Experimente aumentar o raio de busca.' : ' Volte em breve, mais pessoas estão se preparando!'}
                </p>
              </div>
            )}

            {!loading && pessoas.length > 0 && (
              <div className="space-y-3">
                {pessoas.map((pessoa) => (
                  <div
                    key={pessoa.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                          {getTipoIcon(pessoa.mochila_tipo || 'BOB')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {pessoa.full_name || 'Preparado'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">
                              {getTipoLabel(pessoa.mochila_tipo || 'BOB')}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-green-600 font-medium">
                              {pessoa.distance < 1 
                                ? `${Math.round(pessoa.distance * 1000)}m` 
                                : `${pessoa.distance} km`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs text-gray-400">
                          {pessoa.last_seen 
                            ? `Ativo ${new Date(pessoa.last_seen).toLocaleDateString()}` 
                            : 'Recente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Botão Voltar */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        {/* Observação de privacidade */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 Sua privacidade é importante. Apenas sua distância aproximada é compartilhada.
            Nenhuma informação pessoal ou localização exata é revelada.
          </p>
        </div>
      </div>
    </div>
  )
}