'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { X, User, Loader2, MessageCircle } from 'lucide-react'

interface Membro {
  id: string
  full_name: string
  city: string
  state: string
}

interface Grupo {
  id: number
  name: string
  city_name?: string
  member_count: number
}

interface ModalMembrosProps {
  grupo: Grupo | null
  aberto: boolean
  onFechar: () => void
}

export default function ModalMembros({ grupo, aberto, onFechar }: ModalMembrosProps) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!aberto || !grupo) return

    const carregarMembros = async () => {
      setCarregando(true)
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
          .eq('group_id', grupo.id)

        if (error) throw error

        const lista = (data || [])
          .map((item: any) => item.profile)
          .filter(Boolean)
          .sort((a: any, b: any) => 
            (a.full_name || '').localeCompare(b.full_name || '')
          )

        setMembros(lista)
      } catch (error) {
        console.error('Erro ao carregar membros:', error)
        setMembros([])
      } finally {
        setCarregando(false)
      }
    }

    carregarMembros()
  }, [aberto, grupo])

  if (!aberto || !grupo) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onClick={onFechar}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">
              {grupo.city_name || grupo.name}
            </h2>
            <p className="text-xs text-gray-500">
              {grupo.member_count} {grupo.member_count === 1 ? 'membro' : 'membros'}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de membros */}
        <div className="flex-1 overflow-y-auto p-4">
          {carregando ? (
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
                  onClick={onFechar}
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
            onClick={onFechar}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
