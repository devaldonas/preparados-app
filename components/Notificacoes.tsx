'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Bell, X, CheckCircle, AlertCircle, Info, MessageCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

interface MessageNotification {
  id: number
  user_id: string
  sender_id: string
  sender_name: string
  message_id: number
  group_id: number
  type: 'group' | 'private'
  content: string
  read: boolean
  created_at: string
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [channel, setChannel] = useState<any>(null)
  const router = useRouter()

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
        await carregarMessageNotifications(user.id)
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

      if (error) {
        console.error('Erro ao carregar notificações:', error)
        setNotificacoes([])
        setUnreadCount(0)
        return
      }

      setNotificacoes(data || [])
      calcularUnread(data || [], messageNotifications)
    } catch (error) {
      console.log('ℹ️ Erro ao carregar notificações:', error)
      setNotificacoes([])
      setUnreadCount(0)
    }
  }

  const carregarMessageNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('message_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao carregar notificações de mensagens:', error)
        setMessageNotifications([])
        return
      }

      setMessageNotifications(data || [])
      calcularUnread(notificacoes, data || [])
    } catch (error) {
      console.error('Erro ao carregar notificações de mensagens:', error)
      setMessageNotifications([])
    }
  }

  const calcularUnread = (notifs: Notificacao[], msgNotifs: MessageNotification[]) => {
    const unreadNotifs = notifs.filter(n => !n.lida).length
    const unreadMsg = msgNotifs.filter(m => !m.read).length
    setUnreadCount(unreadNotifs + unreadMsg)
  }

  const inscreverNotificacoes = async (userId: string) => {
    if (subscribed) {
      console.log('ℹ️ Listener já está configurado')
      return
    }

    console.log('🔌 Inscrevendo no canal de notificações...')

    try {
      // Canal para notificações do sistema
      const newChannel = supabase.channel(`notificacoes:${userId}`)

      newChannel.on(
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

      // Canal para notificações de mensagens
      newChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('📬 Nova notificação de mensagem:', payload)
          const novaMsg = payload.new as MessageNotification
          setMessageNotifications(prev => [novaMsg, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )

      newChannel.subscribe((status: string) => {
        console.log('📡 Status da inscrição:', status)
        if (status === 'SUBSCRIBED') {
          setSubscribed(true)
        }
      })

      setChannel(newChannel)
    } catch (error) {
      console.log('ℹ️ Erro ao inscrever notificações:', error)
    }
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

  const marcarMensagemComoLida = async (id: number) => {
    try {
      const { error } = await supabase
        .from('message_notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      setMessageNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error)
    }
  }

  const irParaMensagem = (notificacao: MessageNotification) => {
    marcarMensagemComoLida(notificacao.id)
    if (notificacao.type === 'group') {
      router.push(`/grupo/${notificacao.group_id}`)
    } else {
      router.push(`/chat/${notificacao.sender_id}`)
    }
    setIsOpen(false)
  }

  const marcarTodasComoLidas = async () => {
    if (!userId) return

    try {
      // Marcar notificações do sistema
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', userId)
        .eq('lida', false)

      // Marcar notificações de mensagens
      await supabase
        .from('message_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      setNotificacoes(prev =>
        prev.map(n => ({ ...n, lida: true }))
      )
      setMessageNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
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

  const getMessageIcon = (type: string) => {
    if (type === 'group') {
      return <Users size={18} className="text-[#FFB800]" />
    }
    return <MessageCircle size={18} className="text-blue-500" />
  }

  if (loading || !userId) {
    return null
  }

  const totalUnread = unreadCount

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={20} className="text-gray-600" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-black">Notificações</h3>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
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

          <div className="overflow-y-auto flex-1">
            {notificacoes.length === 0 && messageNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <>
                {/* Notificações de Mensagens */}
                {messageNotifications.filter(m => !m.read).map((msg) => (
                  <div
                    key={`msg-${msg.id}`}
                    className="flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer bg-blue-50/30"
                    onClick={() => irParaMensagem(msg)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getMessageIcon(msg.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {msg.type === 'group' ? 'Mensagem em grupo' : `Mensagem de ${msg.sender_name}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Notificações do Sistema */}
                {notificacoes.filter(n => !n.lida).map((notificacao) => (
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
                ))}
              </>
            )}
          </div>

          {messageNotifications.length > 0 || notificacoes.length > 0 ? (
            <div className="p-3 border-t border-gray-100 text-center">
              <Link
                href="/notificacoes"
                className="text-sm text-[#FFB800] hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
