'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Canal {
  id: string
  nome: string
  tipo: string
  participantes: { count: number } | number
}

export default function Comunicador() {
  const [user, setUser] = useState<any>(null)
  const [canais, setCanais] = useState<Canal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await carregarCanais()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const carregarCanais = async () => {
    // Buscar canais
    const { data: canaisData } = await supabase
      .from('comunicador_canais')
      .select('*')
    
    if (!canaisData) {
      setCanais([])
      return
    }

    // Buscar contagem de participantes para cada canal
    const canaisComParticipantes = await Promise.all(
      canaisData.map(async (canal) => {
        const { count } = await supabase
          .from('comunicador_participantes')
          .select('*', { count: 'exact', head: true })
          .eq('canal_id', canal.id)
        
        return {
          ...canal,
          participantes: count || 0
        }
      })
    )
    
    setCanais(canaisComParticipantes)
  }

  const entrarNoCanal = async (canalId: string) => {
    // Registrar participação
    await supabase
      .from('comunicador_participantes')
      .upsert({
        canal_id: canalId,
        usuario_id: user.id
      })
    
    router.push(`/comunicador/canal/${canalId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-preparados-blue"></div>
      </div>
    )
  }

  const totalParticipantes = (participantes: any): number => {
    if (typeof participantes === 'number') return participantes
    if (participantes && typeof participantes === 'object' && 'count' in participantes) {
      return participantes.count
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📻</div>
          <h1 className="text-3xl font-bold text-preparados-blue mb-2">Comunicador Via Rádio</h1>
          <p className="text-gray-600">
            Pressione o botão para falar. Funciona mesmo sem internet (rede Dakila)
          </p>
        </div>

        <div className="space-y-4">
          {canais.map((canal) => (
            <div key={canal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{canal.nome}</h2>
                  <p className="text-sm text-gray-500">
                    {totalParticipantes(canal.participantes)} participante(s) agora
                  </p>
                </div>
                <button
                  onClick={() => entrarNoCanal(canal.id)}
                  className="bg-preparados-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition"
                >
                  Entrar no Canal
                </button>
              </div>
            </div>
          ))}
        </div>

        {canais.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">Nenhum canal disponível no momento.</p>
            <p className="text-yellow-600 text-sm mt-1">Entre em contato com o administrador.</p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar à Home
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 Comunique-se instantaneamente com outros Preparados
          </p>
        </div>
      </div>
    </div>
  )
}