'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GroupMap from '@/components/GroupMap'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface UserLocation {
  userId: string
  userName: string | null
  latitude: number
  longitude: number
  groupId: number | null
  cep: string
  mochila_tipo: string
}

export default function PessoasProximas() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [totalPreparados, setTotalPreparados] = useState(0)
  const [userCep, setUserCep] = useState('')
  const [showGroupsList, setShowGroupsList] = useState(false)  // ← NOVO ESTADO
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadUserData(user.id)
        await loadUserLocations()
        await loadTotalPreparados()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadUserData = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, cep, latitude, longitude, mochila_tipo')
      .eq('id', userId)
      .single()
    
    if (data) {
      setUserCep(data.cep || '')
    }
  }

  const loadUserLocations = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, cep, latitude, longitude, mochila_tipo')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (data) {
      setUserLocations(data.map(p => ({
        userId: p.id,
        userName: p.full_name,
        latitude: p.latitude,
        longitude: p.longitude,
        groupId: null,
        cep: p.cep || '',
        mochila_tipo: p.mochila_tipo || 'BOB'
      })))
    }
  }

  const loadTotalPreparados = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (count !== null) {
      setTotalPreparados(count)
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
      await loadUserLocations()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="text-center mb-8">
          <img 
            src="/images/pessoas-icon.png" 
            alt="Pessoas Próximas" 
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-black mb-2">PESSOAS PRÓXIMAS</h1>
          <p className="text-gray-600">
            Conecte-se com pessoas que também estão se preparando
          </p>
        </div>

        {/* Contadores e botão Ver Todos Grupos */}
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
            <div className="text-3xl font-bold text-black"></div>
            <p className="text-sm text-black font-medium">
              {showGroupsList ? 'Ocultar Grupos' : 'Ver Todos Grupos'}
            </p>
          </button>
        </div>

        {/* Mapa */}
        <div className="mb-6">
          <GroupMap 
            userLocations={userLocations}
            showGroupsList={showGroupsList}           // ← PASSAR ESTADO
            setShowGroupsList={setShowGroupsList}     // ← PASSAR FUNÇÃO
            onGroupSelect={(groupId) => {
              const targetGroup = groupId || 1
              router.push(`/grupo/${targetGroup}`)
            }}
          />
        </div>

        {/* Controles */}
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
            className="block text-center bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition h-9 flex items-center justify-center"
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