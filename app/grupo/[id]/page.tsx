'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  id: number
  content: string
  created_at: string
  user_id: string
  user_name: string
}

export default function GrupoChat() {
  const params = useParams()
  const router = useRouter()
  const grupoId = params.id as string

  console.log('Parâmetro id recebido:', grupoId)
  console.log('URL atual:', window.location.href)

  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState('Chat do Grupo')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let subscription: any = null

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      setLoading(true)
      await loadGroupInfo()
      await loadMessages()
      subscription = subscribeToMessages()
      setLoading(false)
    }

    init()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [grupoId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadGroupInfo = async () => {
    const { data } = await supabase
      .from('groups')
      .select('name')
      .eq('id', grupoId)
      .single()
    
    if (data) {
      setGroupName(data.name)
    }
  }

  const loadMessages = async () => {
    const { data } = await supabase
      .from('group_messages')
      .select('*, user:profiles(full_name)')
      .eq('group_id', grupoId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        user_id: m.user_id,
        user_name: m.user?.full_name || 'Preparado'
      })))
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`group:${grupoId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${grupoId}` },
        (payload) => {
          setMessages(prev => [...prev, {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            user_name: payload.new.user_name || 'Preparado'
          }])
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: parseInt(grupoId),
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'Preparado',
        content: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho fixo */}
      <div className="bg-[#FFB800] text-black p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{groupName}</h1>
            <p className="text-sm opacity-80">Converse com Preparados próximos</p>
          </div>
          <button
            onClick={() => window.location.href = '/pessoas'}
            className="text-black hover:opacity-70 transition text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Área de mensagens - flexível e rolável */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Nenhuma mensagem ainda. Seja o primeiro a falar!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  isOwn
                    ? 'bg-[#FFB800] text-black'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 text-gray-500">{msg.user_name}</p>
                )}
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'opacity-70' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fixo na parte inferior */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 shadow-md">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent text-base"
          />
          <button
            onClick={sendMessage}
            className="bg-[#FFB800] text-black px-5 py-2 rounded-xl font-semibold hover:bg-[#E5A600] transition whitespace-nowrap"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Botão Voltar ao Mapa (fora do fluxo do chat) */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/pessoas'}
          className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition w-full"
        >
          ← Voltar ao Mapa
        </button>
      </div>
    </div>
  )
}