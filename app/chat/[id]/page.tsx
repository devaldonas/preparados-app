'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { useVisualViewport } from '@/hooks/useVisualViewport'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const router = useRouter()

  const viewportHeight = useVisualViewport()

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

  useEffect(() => {
    const carregarChat = async () => {
      try {
        const resolvedParams = await params
        const otherId = resolvedParams.id
        setOtherUserId(otherId)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', otherId)
          .single()
        setOtherUser(profile)

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),` +
            `and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true })

        if (messagesError) {
          console.error('Erro ao carregar mensagens:', messagesError)
        } else if (messagesData) {
          setMessages(messagesData)
        }

        await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', otherId)

      } catch (error) {
        console.error('Erro ao carregar chat:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarChat()
  }, [params, router])

  useEffect(() => {
    if (!otherUserId || !user?.id) return

    const channel = supabase
      .channel(`chat-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const newMsg = payload.new as Message
          const isRelevant =
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId)

          if (!isRelevant) return

          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          if (newMsg.receiver_id === user.id) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then(() => {})
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [otherUserId, user?.id])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const enviarMensagem = async () => {
    if (!newMessage.trim() || !user || !otherUserId || sending) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: newMessage.trim(),
          private: true,
          read: false
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data]
      })
      setNewMessage('')
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
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: viewportHeight }}
    >
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/pessoas" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-semibold text-gray-900">{otherUser?.full_name || 'Usuário'}</p>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8">
            Nenhuma mensagem ainda. Comece a conversa!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  isOwn
                    ? 'bg-[#FFB800] text-black rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}>
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {formatarDataHora(msg.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div
        className="flex-shrink-0 bg-white border-t border-gray-200 p-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
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
