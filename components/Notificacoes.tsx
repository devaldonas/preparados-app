'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Bell, BellOff, X } from 'lucide-react'

export default function Notificacoes() {
  const [user, setUser] = useState<any>(null)
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await carregarNotificacoes(user.id)
        configurarListener(user.id)
      }
    }

    getUser()

    // 🔥 Cleanup: remover inscrição ao desmontar
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        isSubscribedRef.current = false
      }
    }
  }, [])

  const carregarNotificacoes = async (userId: string) => {
    try {
      const { data, error } = await (supabase
        .from('mentoria_notificacoes') as any)
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Erro ao carregar notificações:', error)
        return
      }

      setNotificacoes(data || [])
      setUnreadCount(data?.filter((n: any) => !n.lida).length || 0)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const configurarListener = (userId: string) => {
    // 🔥 Evitar múltiplas inscrições
    if (isSubscribedRef.current) {
      console.log('ℹ️ Listener já está configurado')
      return
    }

    try {
      const channel = supabase
        .channel('notificacoes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mentoria_notificacoes',
            filter: `usuario_id=eq.${userId}`
          },
          (payload) => {
            console.log('📬 Nova notificação:', payload)
            setNotificacoes(prev => [payload.new, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da inscrição:', status)
        })

      channelRef.current = channel
      isSubscribedRef.current = true
    } catch (error) {
      console.error('❌ Erro ao configurar listener:', error)
    }
  }

  const marcarComoLida = async (id: number) => {
    try {
      await (supabase
        .from('mentoria_notificacoes') as any)
        .update({ lida: true })
        .eq('id', id)

      setNotificacoes(prev => prev.map(n => 
        n.id === id ? { ...n, lida: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const marcarTodasComoLidas = async () => {
    if (!user) return

    try {
      await (supabase
        .from('mentoria_notificacoes') as any)
        .update({ lida: true })
        .eq('usuario_id', user.id)
        .eq('lida', false)

      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        {unreadCount > 0 ? (
          <Bell size={20} className="text-[#FFB800]" />
        ) : (
          <BellOff size={20} className="text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.6rem] rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-[#FFB800] hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-gray-50 transition flex items-start gap-3 ${
                    !notif.lida ? 'bg-[#FFB800]/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.lida ? 'font-semibold' : 'text-gray-600'}`}>
                      {notif.mensagem || 'Nova notificação'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.lida && (
                    <button
                      onClick={() => marcarComoLida(notif.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-2 border-t border-gray-100 text-center">
            <button
              onClick={() => setShowDropdown(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
