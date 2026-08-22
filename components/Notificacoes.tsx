'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

interface Notificacao {
  id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  lida: boolean
  link?: string
  created_at: string
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }
        setUserId(user.id)

        await carregarNotificacoes(user.id)
        await inscreverNotificacoes(user.id)

        console.log('📡 Status da inscrição:', subscribed ? 'SUBSCRIBED' : 'CLOSED')
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (channel) {
        console.log('🔌 Desinscrevendo do canal de notificações')
        channel.unsubscribe()
      }
    }
  }, [])

  const carregarNotificacoes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotificacoes(data || [])
      const unread = data?.filter((n: Notificacao) => !n.lida).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const inscreverNotificacoes = async (userId: string) => {
    if (subscribed) {
      console.log('ℹ️ Listener já está configurado')
      return
    }

    console.log('🔌 Inscrevendo no canal de notificações...')

    const newChannel = supabase
      .channel(`notificacoes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('📬 Nova notificação:', payload)
          const novaNotificacao = payload.new as Notificacao
          setNotificacoes(prev => [novaNotificacao, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Status da inscrição:', status)
        if (status === 'SUBSCRIBED') {
          setSubscribed(true)
        }
      })

    setChannel(newChannel)
  }

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id)

      if (error) throw error

      setNotificacoes(prev =>
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const marcarTodasComoLidas = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', userId)
        .eq('lida', false)

      if (error) throw error

      setNotificacoes(prev =>
        prev.map(n => ({ ...n, lida: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />
      default:
        return <Info size={18} className="text-blue-500" />
    }
  }

  if (loading || !userId) {
    return null
  }

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[500px] flex flex-col">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-black">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-xs text-[#FFB800] hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto flex-1">
            {notificacoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={`flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition ${
                    !notificacao.lida ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notificacao.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {notificacao.titulo}
                        </p>
                        <p className="text-sm text-gray-600 break-words">
                          {notificacao.mensagem}
                        </p>
                        {notificacao.link && (
                          <Link
                            href={notificacao.link}
                            className="text-xs text-[#FFB800] hover:underline mt-1 inline-block"
                            onClick={() => {
                              marcarComoLida(notificacao.id)
                              setIsOpen(false)
                            }}
                          >
                            Ver mais
                          </Link>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <button
                          onClick={() => marcarComoLida(notificacao.id)}
                          className="flex-shrink-0 text-xs text-gray-400 hover:text-[#FFB800] transition"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          {notificacoes.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <Link
                href="/notificacoes"
                className="text-sm text-[#FFB800] hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
