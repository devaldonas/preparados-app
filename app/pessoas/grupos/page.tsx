'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MapPin, User, X, Loader2, MessageCircle } from 'lucide-react'

interface Group {
  id: number
  name: string
  city_name: string
  member_count: number
}

interface Membro {
  id: string
  full_name: string
  city: string
  state: string
}

export default function ListaGrupos() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [grupoSelecionado, setGrupoSelecionado] = useState<Group | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [carregandoMembros, setCarregandoMembros] = useState(false)
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

      const gruposValidos = (groupsData || []).filter((g: any) => {
        if (g.name === 'Localização do Usuário') return false
        if (g.name === 'Localizacao do Usuario') return false
        if (g.name === 'Sem grupo') return false
        if (g.name === 'Sem cidade definida') return false
        if (g.member_count === 0) return false
        return true
      })

      // 🆕 Ordena: Brasil (id 43) primeiro, depois por nome
      const gruposOrdenados = gruposValidos.sort((a: any, b: any) => {
        if (a.id === 43) return -1
        if (b.id === 43) return 1
        return a.name.localeCompare(b.name)
      })

      setGroups(gruposOrdenados)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  const entrarNoGrupo = (groupId: number) => {
    router.push(`/grupo/${groupId}`)
  }

  // 🆕 Buscar membros do grupo
  const abrirMembros = async (e: React.MouseEvent, group: Group) => {
    e.stopPropagation() // Impede que abra o grupo
    setGrupoSelecionado(group)
    setCarregandoMembros(true)
    setMembros([])

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          profile:profiles (
            id,
            full_name,
            city,
            state
          )
        `)
        .eq('group_id', group.id)

      if (error) throw error

      const listaMembros = (data || [])
        .map((item: any) => item.profile)
        .filter(Boolean)
        .sort((a: any, b: any) => 
          (a.full_name || '').localeCompare(b.full_name || '')
        )

      setMembros(listaMembros)
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      setMembros([])
    } finally {
      setCarregandoMembros(false)
    }
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
              <div
                key={group.id}
                onClick={() => entrarNoGrupo(group.id)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition text-left cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    entrarNoGrupo(group.id)
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                      <img 
                        src="/images/localizacao-icon.png" 
                        alt="Grupo" 
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getNomeExibicao(group)}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {group.city_name && (
                          <span className="flex items-center gap-1">
                            <img 
                              src="/images/localizacao-icon.png" 
                              alt="Localização" 
                              className="w-3 h-3 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            {group.city_name}
                          </span>
                        )}
                        <span>•</span>
                        <button
                          onClick={(e) => abrirMembros(e, group)}
                          className="flex items-center gap-1 hover:text-[#FFB800] hover:underline transition"
                        >
                          <User size={12} />
                          {group.member_count || 0} membros
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#FFB800]">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🆕 MODAL DE MEMBROS */}
        {grupoSelecionado && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setGrupoSelecionado(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do modal */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {grupoSelecionado.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {grupoSelecionado.member_count} {grupoSelecionado.member_count === 1 ? 'membro' : 'membros'}
                  </p>
                </div>
                <button
                  onClick={() => setGrupoSelecionado(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lista de membros */}
              <div className="flex-1 overflow-y-auto p-4">
                {carregandoMembros ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-[#FFB800]" />
                  </div>
                ) : membros.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    Nenhum membro encontrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {membros.map((membro) => (
                      <Link
                        key={membro.id}
                        href={`/chat/${membro.id}`}
                        onClick={() => setGrupoSelecionado(null)}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-[#FFB800]/10 rounded-lg transition cursor-pointer group"
                      >
                        <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-[#FFB800]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate group-hover:text-[#FFB800] transition">
                            {membro.full_name || 'Sem nome'}
                          </p>
                          {membro.city && (
                            <p className="text-xs text-gray-500 truncate">
                              {membro.city}{membro.state ? `, ${membro.state}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-[#FFB800] opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                          <MessageCircle size={18} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setGrupoSelecionado(null)}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão Voltar ao Início */}
        <div className="mt-8">
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
