'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [radius, setRadius] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
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
      const loc = { lat: data.latitude, lng: data.longitude }
      setLocation(loc)
      await buscarPessoasProximas(loc.lat, loc.lng)
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
        const loc = { lat: latitude, lng: longitude }
        setLocation(loc)
        
        // Salvar localização no perfil do usuário
        if (user) {
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
          } else {
            console.log('Localização salva com sucesso')
          }
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

  const buscarPessoasProximas = async (lat: number, lng: number, showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    
    // Buscar TODOS os usuários com localização (exceto o próprio)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, latitude, longitude, mochila_tipo, last_location_update')
      .not('id', 'eq', user?.id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    
    if (error) {
      console.error('Erro ao buscar pessoas:', error)
      if (showRefresh) setRefreshing(false)
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
        .slice(0, 20)
      
      console.log(`Encontradas ${pessoasProximas.length} pessoas num raio de ${radius} km`)
      setPessoas(pessoasProximas)
    } else {
      setPessoas([])
      console.log('Nenhuma outra pessoa com localização encontrada')
    }
    if (showRefresh) setRefreshing(false)
  }

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
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

  const handleRefresh = () => {
    if (location) {
      buscarPessoasProximas(location.lat, location.lng, true)
    }
  }

  if (loading) {
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">🗺️ PESSOAS PRÓXIMAS</h1>
          <p className="text-gray-600">
            Conecte-se com pessoas que também estão se preparando
          </p>
        </div>

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
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>
        )}

        {location && (
          <>
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
                    const newRadius = parseInt(e.target.value)
                    setRadius(newRadius)
                    if (location) {
                      buscarPessoasProximas(location.lat, location.lng)
                    }
                  }}
                  className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition flex items-center gap-2"
                >
                  <span className="text-lg">🔄</span>
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                {refreshing ? 'Buscando...' : `${pessoas.length} pessoa(s) se preparando num raio de ${radius} km`}
              </p>
            </div>

            {!refreshing && pessoas.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa encontrada</h3>
                <p className="text-gray-500 text-sm">
                  Nenhuma pessoa se preparando foi encontrada num raio de {radius} km.
                  {radius < 20 ? ' Experimente aumentar o raio de busca.' : ' Volte em breve, mais pessoas estão se preparando!'}
                </p>
              </div>
            )}

            {!refreshing && pessoas.length > 0 && (
              <div className="space-y-3">
                {pessoas.map((pessoa) => (
                  <div key={pessoa.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
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
                            <span className="text-gray-500">{getTipoLabel(pessoa.mochila_tipo || 'BOB')}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-green-600 font-medium">
                              {pessoa.distance < 1 
                                ? `${Math.round(pessoa.distance * 1000)}m` 
                                : `${pessoa.distance} km`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {pessoa.last_seen ? `Ativo ${new Date(pessoa.last_seen).toLocaleDateString()}` : 'Recente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8">
          <Link href="/dashboard" className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition">
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 Sua privacidade é importante. Apenas sua distância aproximada é compartilhada.
          </p>
        </div>
      </div>
    </div>
  )
}