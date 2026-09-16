'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, User } from 'lucide-react'

interface Message {
  id: number
  group_id: number
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export default function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const [grupoId, setGrupoId] = useState<number | null>(null)
  const [grupoNome, setGrupoNome] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const formatarDataHora = (data: string) => {
    if (!data) return ''
    try {
      const date = new Date(data)
      return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return ''
    }
  }

  // 🔥 1. CARREGAR DADOS INICIAIS
  useEffect(() => {
    const carregarGrupo = async () => {
      try {
        const resolvedParams = await params
        const idNum = parseInt(resolvedParams.id)
        setGrupoId(idNum)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { data: grupo, error: grupoError } = await supabase
          .from('groups')
          .select('name, city_name')
          .eq('id', idNum)
          .single()

        if (grupoError) {
          console.error('Erro ao buscar grupo:', grupoError)
          setGrupoNome('Grupo')
        } else if (grupo) {
          if (grupo.city_name && grupo.city_name.trim() !== '') {
            setGrupoNome(grupo.city_name)
          } else {
            setGrupoNome(grupo.name || 'Grupo')
          }
        }

        await carregarMensagens(idNum)
      } catch (error) {
        console.error('Erro ao carregar grupo:', error)
        router.push('/pessoas')
      } finally {
        setLoading(false)
      }
    }

    carregarGrupo()
  }, [params, router])

  // 🔥 2. REALTIME: Escutar novas mensagens do grupo
  useEffect(() => {
    if (!grupoId) return

    console.log('📡 Iniciando realtime para o grupo:', grupoId)

    const channel = supabase
      .channel(`grupo-${grupoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${grupoId}`
        },
        (payload: any) => {
          console.log('🔔 Nova mensagem recebida:', payload.new)
          const novaMensagem = payload.new as Message
          
          setMessages((prev) => {
            if (prev.some(m => m.id === novaMensagem.id)) return prev
            return [...prev, novaMensagem]
          })
        }
      )
      .subscribe((status: string, err?: Error) => {
        console.log('📡 Status do realtime:', status, err || '')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Erro no canal realtime:', err)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('📡 Removendo canal realtime')
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [grupoId])

  const carregarMensagens = async (idNum: number) => {
    try {
      const { data: mensagens } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', idNum)
        .order('created_at', { ascending: true })

      if (mensagens) {
        setMessages(mensagens)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // 🔥 3. SCROLL ISOLADO — só o container de mensagens rola
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const enviarMensagem = async () => {
    if (!newMessage.trim() || !grupoId || !user) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: grupoId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || 'Usuário',
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      // Realtime adiciona a mensagem automaticamente
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 🔥 Header do grupo — fixo no topo */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link
          href="/pessoas"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-semibold text-gray-900">{grupoNome || 'Grupo'}</p>
          <p className="text-xs text-gray-500">Grupo de conversa</p>
        </div>
      </div>

      {/* 🔥 Área de mensagens — ÚNICA parte que rola */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8">
            <p>Nenhuma mensagem ainda</p>
            <p>Seja o primeiro a enviar uma mensagem</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isOwn ? 'bg-[#FFB800]' : 'bg-gray-200'
                }`}>
                  <User size={16} className={isOwn ? 'text-black' : 'text-gray-600'} />
                </div>
                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  <p className={`text-xs ${isOwn ? 'text-[#FFB800]' : 'text-gray-500'}`}>
                    {isOwn ? 'Você' : msg.user_name}
                  </p>
                  <div className={`p-3 rounded-lg mt-1 ${
                    isOwn ? 'bg-[#FFB800] text-black' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-[10px] opacity-70 mt-1">
                      {formatarDataHora(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 🔥 Input — fixo no rodapé, com safe area */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-200 p-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-sm"
            disabled={sending}
          />
          <button
            onClick={enviarMensagem}
            disabled={!newMessage.trim() || sending}
            className="bg-[#FFB800] text-black p-2 rounded-full hover:bg-[#E5A600] transition disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
