'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

  console.log('Parâmetro id recebido:', grupoId) // ← ADICIONE ESTA LINHA
  console.log('URL atual:', window.location.href) // ← ADICIONE ESTA LINHA

  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadMessages()
        subscribeToMessages()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('group_messages')
      .select('*, user:profiles(full_name)')
      .eq('group_id', grupoId)
      .order('created_at', { ascending: true })
      .limit(50)

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
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#FFB800] text-black p-4">
            <h1 className="text-xl font-bold">Chat do Grupo</h1>
            <p className="text-sm opacity-80">Converse com Preparados próximos</p>
          </div>

          <div className="h-[500px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.user_id === user?.id
                      ? 'bg-[#FFB800] text-black'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1">{msg.user_name}</p>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
            />
            <button
              onClick={sendMessage}
              className="bg-[#FFB800] text-black px-6 py-2 rounded-xl font-semibold hover:bg-[#E5A600] transition"
            >
              Enviar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Link href="/pessoas" className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition">
            ← Voltar ao Mapa
          </Link>
        </div>
      </div>
    </div>
  )
}"// redeploy" 
