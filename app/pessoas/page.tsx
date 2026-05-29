'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MapaPreparados from '@/components/MapaPreparados'
import { getDistance } from 'geolib'

interface PessoaProxima {
  id: string
  full_name: string
  cep: string
  latitude: number
  longitude: number
  distance: number
  last_seen: string
  mochila_tipo: string
}

interface BaseApoio {
  id: string
  nome: string
  tipo: string
  latitude: number
  longitude: number
  endereco: string
}

// Dados mockados para teste
const MOCK_PESSOAS: PessoaProxima[] = [
  {
    id: '1',
    full_name: 'Narciso (Teste)',
    cep: '01000-000',
    latitude: -23.5505,
    longitude: -46.6333,
    distance: 8.5,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'BOB',
  },
  {
    id: '2',
    full_name: 'Michel (Teste)',
    cep: '01001-000',
    latitude: -23.548,
    longitude: -46.635,
    distance: 3.2,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'EDC',
  },
  {
    id: '3',
    full_name: 'EDGE (Teste)',
    cep: '01002-000',
    latitude: -23.555,
    longitude: -46.64,
    distance: 12.0,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'BOLT',
  },
]

// Cache de coordenadas por CEP
const cacheCoordenadasGlobal: Record<string, { lat: number; lng: number }> = {}

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pessoas, setPessoas] = useState<PessoaProxima[]>([])
  const [bases, setBases] = useState<BaseApoio[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [useMockData, setUseMockData] = useState(false)
  const [userCep, setUserCep] = useState('')
  const [totalPreparados, setTotalPreparados] = useState(0)
  const router = useRouter()

  const getCoordenadasPorCep = async (cep: string) => {
    if (cacheCoordenadasGlobal[cep]) {
      return cacheCoordenadasGlobal[cep]
    }
    
    try {
      const cepLimpo = cep.replace(/\D/g, '')
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const endereco = await viaCepResponse.json()
      
      if (endereco.erro) return null
      
      const query = `${endereco.logradouro}, ${endereco.localidade}, ${endereco.uf}`
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      const geoData = await geoResponse.json()
      
      if (geoData && geoData.length > 0) {
        const coords = {
          lat: parseFloat(geoData[0].lat),
          lng: parseFloat(geoData[0].lon)
        }
        cacheCoordenadasGlobal[cep] = coords
        return coords
      }
      return null
    } catch (err) {
      console.error('Erro ao buscar coordenadas do CEP:', err)
      return null
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadUserData(user.id)
        await buscarPessoasPorCep()
        await carregarBasesApoio()
        await carregarTotalPreparados()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadUserData = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, cep, latitude, longitude')
      .eq('id', userId)
      .single()
    
    if (data) {
      setUserCep(data.cep || '')
      if (data.latitude && data.longitude) {
        setUserLocation({ lat: data.latitude, lng: data.longitude })
      }
    }
  }

  const carregarTotalPreparados = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (count !== null) {
      setTotalPreparados(count)
    }
  }

  const buscarPessoasPorCep = async () => {
    setRefreshing(true)
    
    if (!user || !user.id) {
      setUseMockData(true)
      setPessoas(MOCK_PESSOAS)
      setRefreshing(false)
      return
    }
    
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single()
      
      if (!userProfile?.latitude || !userProfile?.longitude) {
        console.log('Usuário sem coordenadas, use o botão "Informar meu CEP"')
        setPessoas([])
        setRefreshing(false)
        return
      }
      
      setUserLocation({ lat: userProfile.latitude, lng: userProfile.longitude })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cep, mochila_tipo, last_location_update, latitude, longitude')
        .not('id', 'eq', user.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (error) {
        console.error('Erro Supabase:', error)
        setUseMockData(true)
        setPessoas(MOCK_PESSOAS)
        setRefreshing(false)
        return
      }

      if (!data || data.length === 0) {
        setUseMockData(true)
        setPessoas(MOCK_PESSOAS)
        setRefreshing(false)
        return
      }

      setUseMockData(false)
      
      const pessoasComDistancia: PessoaProxima[] = data.map((pessoa) => {
        const distance = getDistance(
          { latitude: userProfile.latitude, longitude: userProfile.longitude },
          { latitude: pessoa.latitude, longitude: pessoa.longitude }
        ) / 1000
        
        return {
          id: pessoa.id,
          full_name: pessoa.full_name || 'Preparado',
          cep: pessoa.cep,
          mochila_tipo: pessoa.mochila_tipo || 'BOB',
          last_seen: pessoa.last_location_update || new Date().toISOString(),
          latitude: pessoa.latitude,
          longitude: pessoa.longitude,
          distance: Math.round(distance * 10) / 10,
        }
      })
      
      const pessoasProximas = pessoasComDistancia
        .filter(p => p.distance <= 100)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50)
      
      setPessoas(pessoasProximas)
    } catch (err) {
      console.error('Erro inesperado:', err)
      setPessoas(MOCK_PESSOAS)
      setUseMockData(true)
    } finally {
      setRefreshing(false)
    }
  }

  const carregarBasesApoio = async () => {
    const { data } = await supabase
      .from('bases_apoio')
      .select('*')
    
    if (data) {
      setBases(data)
    }
  }

  const atualizarCep = async () => {
    const novoCep = prompt('Digite seu CEP para encontrar pessoas próximas:', userCep)
    if (novoCep && novoCep.length >= 8) {
      const coords = await getCoordenadasPorCep(novoCep)
      
      if (coords) {
        await supabase
          .from('profiles')
          .update({ 
            cep: novoCep,
            latitude: coords.lat,
            longitude: coords.lng,
            last_location_update: new Date().toISOString()
          })
          .eq('id', user.id)
        
        setUserCep(novoCep)
        setUserLocation(coords)
        await buscarPessoasPorCep()
      } else {
        alert('Não foi possível localizar este CEP. Tente novamente.')
      }
    }
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
    buscarPessoasPorCep()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  const totalNaRegiao = pessoas.length + (userLocation ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header com ícone */}
        <div className="text-center mb-8">
          <img 
            src="/images/pessoas-icon.png" 
            alt="Pessoas Próximas" 
            className="w-16 h-16 mx-auto mb-4 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <h1 className="text-3xl font-bold text-black mb-2">PESSOAS PRÓXIMAS</h1>
          <p className="text-gray-600">
            Conecte-se com pessoas que também estão se preparando
          </p>
        </div>

        {/* Contadores */}
        {userCep && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <div className="text-3xl font-bold text-[#FFB800]">{pessoas.length}</div>
              <p className="text-sm text-gray-600">Preparados próximos</p>
              <p className="text-xs text-gray-400">(até 100 km)</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <div className="text-3xl font-bold text-[#FFB800]">{totalPreparados}</div>
              <p className="text-sm text-gray-600">Total de Preparados</p>
              <p className="text-xs text-gray-400">no Brasil</p>
            </div>
          </div>
        )}

        {!userCep && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
            <img 
              src="/images/checkin-icon.png" 
              alt="Localização" 
              className="w-16 h-16 mx-auto mb-4 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h2 className="text-xl font-semibold mb-4">Configure sua localização</h2>
            <p className="text-gray-600 mb-6">
              Para encontrar pessoas preparadas perto de você, precisamos saber seu CEP.
              Digite seu CEP para começar.
            </p>
            <button
              onClick={atualizarCep}
              className="bg-[#FFB800] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition"
            >
              📍 Informar meu CEP
            </button>
          </div>
        )}

        {userCep && (
          <>
            {/* Mapa */}
            <div className="mb-6">
              <MapaPreparados 
                preparados={pessoas.map(p => ({
                  ...p,
                  type: 'preparado' as const
                }))}
                userLocation={userLocation}
                bases={bases}
              />
            </div>

            {/* Controles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600">CEP cadastrado</p>
                  <p className="font-semibold text-black">{userCep}</p>
                </div>
                <button
                  onClick={atualizarCep}
                  className="text-sm text-[#FFB800] hover:text-[#E5A600] underline"
                >
                  Alterar CEP
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <span className="text-lg">🔄</span>
                  {refreshing ? 'Buscando...' : 'Atualizar'}
                </button>
              </div>
            </div>

            {/* Lista de pessoas */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                📋 Preparados próximos ({pessoas.length})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Pessoas se preparando num raio de até 100 km
              </p>
            </div>

            {!refreshing && pessoas.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <img 
                  src="/images/lampada.jpeg" 
                  alt="Dica" 
                  className="w-8 h-8 mx-auto mb-2 object-contain"
                />
                <p className="text-yellow-800 text-sm">
                  Nenhuma pessoa encontrada num raio de 100 km.
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  💡 Compartilhe o app com amigos para aumentar a comunidade!
                </p>
              </div>
            )}

            {!refreshing && pessoas.length > 0 && (
              <div className="space-y-3">
                {pessoas.map((pessoa) => (
                  <div key={pessoa.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                          {getTipoIcon(pessoa.mochila_tipo)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {pessoa.full_name || 'Preparado'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">{getTipoLabel(pessoa.mochila_tipo)}</span>
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
            🔒 Sua privacidade é importante. Apenas seu CEP é usado para calcular distâncias aproximadas.
          </p>
        </div>
      </div>
    </div>
  )
}