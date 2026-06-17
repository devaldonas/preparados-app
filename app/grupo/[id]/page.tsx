'use client'

import { useEffect, useState, useRef } from 'react'
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

// Função para detectar links na mensagem
const contemLink = (texto: string) => {
  const urlRegex =
    /(https?:\/\/[^\s]+)|(\bwww\.[^\s]+)|([^\s]+\.[a-z]{2,})(\/[^\s]*)?/i
  return urlRegex.test(texto)
}

export default function GrupoChat() {
  const params = useParams()
  const router = useRouter()
  const grupoId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState('Carregando...')
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('group_id, full_name')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', grupoId)
        .single()

      if (groupData) {
        setGroupInfo(groupData)
        setGroupName(groupData.name)
      } else {
        setGroupName('Chat do Grupo')
      }

      setLoading(false)
    }

    carregarDados()
  }, [grupoId, router])

  useEffect(() => {
    if (!user || !grupoId) return

    const carregarMensagens = async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', grupoId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          user_id: m.user_id,
          user_name: m.user_name || 'Preparado'
        })))
      }
    }

    carregarMensagens()

    const subscription = supabase
      .channel(`group:${grupoId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'group_messages', 
          filter: `group_id=eq.${grupoId}` 
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            user_id: newMsg.user_id,
            user_name: newMsg.user_name || 'Preparado'
          }])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [grupoId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    // Verificar se contém links
    if (contemLink(newMessage.trim())) {
      setError('Não é permitido enviar links no chat')
      setTimeout(() => setError(''), 4000)
      return
    }

    setError('')
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Preparado'

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: parseInt(grupoId),
        user_id: user.id,
        user_name: userName,
        content: newMessage.trim()
      })

    if (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } else {
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando chat...</p>
        </div>
      </div>
    )
  }

  const isVisitor = profile?.group_id !== parseInt(grupoId)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#FFB800] text-black p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{groupName}</h1>
            <p className="text-sm opacity-80">
              {groupInfo?.member_count || 0} membros • 
              {groupInfo?.center_latitude ? 'Grupo por localizacao' : 'Grupo geral'}
            </p>
          </div>
          <Link 
            href="/pessoas"
            className="text-black hover:opacity-70 transition text-xl"
          >
            ×
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isVisitor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-blue-700">
              Voce esta visitando o chat de outro grupo.
              Sinta-se a vontade para participar e aprender!
            </p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

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
                    : isVisitor && !isOwn
                    ? 'bg-purple-50 text-gray-800 shadow-sm border border-purple-200'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-500">{msg.user_name}</p>
                  {isVisitor && !isOwn && (
                    <span className="text-xs bg-purple-200 text-purple-700 px-1 rounded">visitante</span>
                  )}
                </div>
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'opacity-70' : 'text-gray-400'}`}>
  {(() => {
    const data = new Date(msg.created_at)
    // Subtrair 3 horas (UTC-3)
    data.setHours(data.getHours() - 3)
    return data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  })()}
</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 shadow-md">
        <div className="max-w-3xl mx-auto">
          {isVisitor && (
            <p className="text-xs text-center text-gray-500 mb-2">
              Voce esta contribuindo com o grupo de outra regiao
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                if (error) setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent text-base"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-[#FFB800] text-black px-5 py-2 rounded-xl font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 whitespace-nowrap"
            >
              Enviar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Não é permitido enviar links no chat
          </p>
        </div>
      </div>
    </div>
  )
}