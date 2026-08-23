'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [receiverId, setReceiverId] = useState<string>('')
  const [receiverName, setReceiverName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarChat = async () => {
      try {
        const { id } = await params
        setReceiverId(id)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', id)
          .single()

        setReceiverName(profile?.full_name || 'Usuário')

        await carregarMensagens(user.id, id)

        const interval = setInterval(() => {
          carregarMensagens(user.id, id)
        }, 3000)

        return () => {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Erro ao carregar chat:', error)
        router.push('/pessoas')
      } finally {
        setLoading(false)
      }
    }

    carregarChat()
  }, [params, router])

  const carregarMensagens = async (userId: string, receiverId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }
      
      setMessages(data || [])
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const enviarMensagem = async () => {
    if (!newMessage.trim() || !receiverId || !user) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim()
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      setNewMessage('')
      await carregarMensagens(user.id, receiverId)
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
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
            href="/pessoas/usuarios"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Chat</h1>
            <p className="text-sm text-gray-500">Conversando com {receiverName}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[400px] overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isOwn ? 'bg-[#FFB800]' : 'bg-gray-200'
                  }`}>
                    <img 
                      src="/images/markmap.png" 
                      alt="Usuário" 
                      className="w-5 h-5 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    <p className={`text-xs ${isOwn ? 'text-[#FFB800]' : 'text-gray-500'}`}>
                      {isOwn ? 'Você' : receiverName}
                    </p>
                    <div className={`p-3 rounded-lg mt-1 ${
                      isOwn ? 'bg-[#FFB800] text-black' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
            />
            <button
              onClick={enviarMensagem}
              disabled={sending || !newMessage.trim()}
              className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
