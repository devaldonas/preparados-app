'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MapPin, User } from 'lucide-react'

interface Group {
  id: number
  name: string
  city_name: string
  member_count: number
}

export default function ListaGrupos() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    carregarGrupos()
  }, [])

  const carregarGrupos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar todos os grupos com contagem de membros
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          city_name,
          member_count
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // 🔥 FILTRAR GRUPOS INVÁLIDOS E VAZIOS
      const gruposValidos = (groupsData || []).filter((g: any) => {
        // Remover grupos com nome inválido
        if (g.name === 'Localização do Usuário') return false
        if (g.name === 'Localizacao do Usuario') return false
        if (g.name === 'Sem grupo') return false
        if (g.name === 'Sem cidade definida') return false
        // Remover grupos vazios (0 membros)
        if (g.member_count === 0) return false
        return true
      })

      setGroups(gruposValidos)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  const entrarNoGrupo = (groupId: number) => {
    router.push(`/grupo/${groupId}`)
  }

  const getNomeExibicao = (group: Group) => {
    if (group.city_name && group.city_name.trim() !== '') {
      return group.city_name
    }
    return group.name
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/pessoas"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Grupos</h1>
            <p className="text-sm text-gray-500">{groups.length} grupos disponíveis</p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum grupo encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => entrarNoGrupo(group.id)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                      <Users size={18} className="text-[#FFB800]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getNomeExibicao(group)}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {group.city_name && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {group.city_name}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {group.member_count || 0} membros
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#FFB800]">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
