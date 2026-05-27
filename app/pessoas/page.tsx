'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PessoaProxima {
  id: string
  full_name: string
  cep: string
  distance: number
  last_seen: string
  mochila_tipo: string
}

// Dados mockados para teste (remover depois)
const MOCK_PESSOAS: PessoaProxima[] = [
  {
    id: '1',
    full_name: 'Narciso (Teste)',
    cep: '01000-000',
    distance: 8.5,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'BOB',
  },
  {
    id: '2',
    full_name: 'Michel (Teste)',
    cep: '01001-000',
    distance: 3.2,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'EDC',
  },
  {
    id: '3',
    full_name: 'EDGE (Teste)',
    cep: '01002-000',
    distance: 12.0,
    last_seen: new Date().toISOString(),
    mochila_tipo: 'BOLT',
  },
]

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pessoas, setPessoas] = useState<PessoaProxima[]>([])
  const [error, setError] = useState('')
  const [radius, setRadius] = useState(50)
  const [refreshing, setRefreshing] = useState(false)
  const [useMockData, setUseMockData] = useState(false)
  const [userCep, setUserCep] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadUserData(user.id)
        await buscarPessoasPorCep()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadUserData = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, cep')
      .eq('id', userId)
      .single()
    
    if (data) {
      setUserCep(data.cep || '')
    }
  }

  const buscarPessoasPorCep = async () => {
    setRefreshing(true)
    
    if (!user || !user.id) {
      console.log('Usuário não autenticado, usando modo demonstração')
      setUseMockData(true)
      setPessoas(MOCK_PESSOAS)
      setRefreshing(false)
      return
    }
    
    try {
      // Buscar perfis com mesmo CEP ou CEPs próximos
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cep, mochila_tipo, last_location_update')
        .not('id', 'eq', user.id)
        .not('cep', 'is', null)
      
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
      // Calcular distância aproximada baseada no CEP (simplificado)
      const pessoasComDistancia: PessoaProxima[] = data.map((pessoa) => ({
        id: pessoa.id,
        full_name: pessoa.full_name || 'Preparado',
        cep: pessoa.cep,
        mochila_tipo: pessoa.mochila_tipo || 'BOB',
        last_seen: pessoa.last_location_update || new Date().toISOString(),
        distance: Math.random() * 50, // Placeholder - substituir por cálculo real
      }))
      
      const pessoasProximas = pessoasComDistancia
        .filter(p => p.distance <= radius)
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

  const atualizarCep = async () => {
    const novoCep = prompt('Digite seu CEP para encontrar pessoas próximas:', userCep)
    if (novoCep && novoCep.length >= 8) {
      await supabase
        .from('profiles')
        .update({ cep: novoCep })
        .eq('id', user.id)
      setUserCep(novoCep)
      await buscarPessoasPorCep()
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

        {!userCep && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
    <img 
      src="/images/checkin-icon.png" 
      alt="Localização" 
      className="w-16 h-16 mx-auto mb-4 object-contain"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Raio de busca</p>
                    <p className="font-semibold text-black">{radius} km</p>
                    <p className="text-xs text-gray-400 mt-1">CEP: {userCep}</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => {
                    const newRadius = parseInt(e.target.value)
                    setRadius(newRadius)
                    buscarPessoasPorCep()
                  }}
                  className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                />
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

            <div className="mb-4">
              <p className="text-gray-600">
                {refreshing ? 'Buscando...' : `${pessoas.length} pessoa(s) se preparando num raio de ${radius} km`}
                {useMockData && pessoas.length > 0 && (
                  <span className="text-xs text-yellow-600 ml-2">(Modo demonstração)</span>
                )}
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
                  Nenhuma pessoa encontrada num raio de {radius} km.
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Tente aumentar o raio de busca ou peça para seus amigos compartilharem o CEP.
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
            🔒 Sua privacidade é importante. Apenas seu CEP é compartilhado para encontrar pessoas próximas.
          </p>
        </div>
      </div>
    </div>
  )
}