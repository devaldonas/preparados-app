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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 🔥 CORRIGIDO: Verificar se precisa subtrair ou adicionar
  const formatarDataHora = (data: string) => {
    if (!data) return ''
    try {
      const date = new Date(data)
      // 🔥 SUBTRAIR 3 HORAS (o banco está adiantado)
      date.setHours(date.getHours() - 3)
      
      const dia = String(date.getDate()).padStart(2, '0')
      const mes = String(date.getMonth() + 1).padStart(2, '0')
      const ano = date.getFullYear()
      const horas = String(date.getHours()).padStart(2, '0')
      const minutos = String(date.getMinutes()).padStart(2, '0')
      
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`
    } catch {
      return ''
    }
  }

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

        const interval = setInterval(() => {
          carregarMensagens(idNum)
        }, 5000)

        return () => {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Erro ao carregar grupo:', error)
        router.push('/pessoas')
      } finally {
        setLoading(false)
      }
    }

    carregarGrupo()
  }, [params, router])

  const carregarMensagens = async (idNum: number) => {
    try {
      const { data: mensagens } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', idNum)
        .order('created_at', { ascending: true })

      if (mensagens) {
        setMessages(mensagens)
        scrollToBottom()
      }
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
    if (!newMessage.trim() || !grupoId || !user) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: grupoId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || 'Usuário',
          content: newMessage.trim()
        })
        .select()
        .single()

      if (error) throw error

      setNewMessage('')
      await carregarMensagens(grupoId)
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
            href="/pessoas"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">{grupoNome || 'Grupo'}</h1>
            <p className="text-sm text-gray-500">Grupo de conversa</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[400px] overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
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
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {formatarDataHora(msg.created_at)}
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
