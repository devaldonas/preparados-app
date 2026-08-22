'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, Send, Volume2, VolumeX, Trash2 } from 'lucide-react'

interface AudioMessage {
  id: string
  user_id: string
  user_name: string
  audio_url: string
  created_at: string
}

export default function CanalPage({ params }: { params: Promise<{ id: string }> }) {
  const [canalId, setCanalId] = useState<string>('')
  const [canalNome, setCanalNome] = useState('')
  const [messages, setMessages] = useState<AudioMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const router = useRouter()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const carregarCanal = async () => {
      try {
        const { id } = await params
        setCanalId(id)

        const { data: canal } = await supabase
          .from('comunicador_canais')
          .select('nome')
          .eq('id', id)
          .single()

        if (canal) {
          setCanalNome(canal.nome)
        }

        // Buscar mensagens
        const { data: mensagens } = await supabase
          .from('comunicador_audios')
          .select('*')
          .eq('canal_id', id)
          .order('created_at', { ascending: false })

        setMessages(mensagens || [])

        // Inscrever para novas mensagens
        const audioChannel = supabase
          .channel(`audio:${id}`)
          .on('broadcast', { event: 'novo-audio' }, (payload: any) => {
            console.log('Áudio recebido:', payload)
            adicionarAudio(payload.payload)
          })
          .subscribe()

        return () => {
          audioChannel.unsubscribe()
        }
      } catch (error) {
        console.error('Erro ao carregar canal:', error)
        router.push('/comunicador')
      } finally {
        setLoading(false)
      }
    }

    carregarCanal()
  }, [params, router])

  const adicionarAudio = (audio: any) => {
    setMessages(prev => [audio, ...prev])
  }

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        
        // Enviar áudio
        await enviarAudio(audioBlob)
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const pararGravacao = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      
      // Parar todas as tracks do stream
      const stream = mediaRecorderRef.current.stream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const enviarAudio = async (audioBlob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      // Upload do áudio para o storage
      const fileName = `${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audios')
        .upload(`comunicador/${canalId}/${fileName}`, audioBlob, {
          contentType: 'audio/webm'
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('audios')
        .getPublicUrl(`comunicador/${canalId}/${fileName}`)

      // Salvar no banco
      const { data: audioData, error: saveError } = await supabase
        .from('comunicador_audios')
        .insert({
          canal_id: canalId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || 'Usuário',
          audio_url: publicUrl
        })
        .select()
        .single()

      if (saveError) throw saveError

      // Broadcast para outros usuários
      await supabase.channel(`audio:${canalId}`).send({
        type: 'broadcast',
        event: 'novo-audio',
        payload: audioData
      })

      setAudioUrl(null)
      setMessages(prev => [audioData, ...prev])

    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      alert('Erro ao enviar áudio')
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const deletarAudio = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este áudio?')) return

    try {
      const { error } = await supabase
        .from('comunicador_audios')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessages(prev => prev.filter(msg => msg.id !== id))
    } catch (error) {
      console.error('Erro ao excluir áudio:', error)
      alert('Erro ao excluir áudio')
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
            href="/comunicador"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">{canalNome}</h1>
            <p className="text-sm text-gray-500">Canal de comunicação</p>
          </div>
        </div>

        {/* Controles de Gravação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            {!recording ? (
              <button
                onClick={iniciarGravacao}
                className="w-16 h-16 bg-[#FFB800] rounded-full flex items-center justify-center hover:bg-[#E5A600] transition"
              >
                <Mic size={28} className="text-black" />
              </button>
            ) : (
              <button
                onClick={pararGravacao}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition animate-pulse"
              >
                <div className="w-8 h-8 bg-white rounded-sm" />
              </button>
            )}
            <span className="text-sm text-gray-500">
              {recording ? 'Gravando...' : 'Toque para gravar'}
            </span>
          </div>
        </div>

        {/* Player do Áudio Gravado */}
        {audioUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
              >
                {isPlaying ? (
                  <VolumeX size={24} className="text-white" />
                ) : (
                  <Volume2 size={24} className="text-white" />
                )}
              </button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="flex-1"
                controls
              />
            </div>
          </div>
        )}

        {/* Lista de Mensagens */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum áudio enviado ainda</p>
              <p className="text-sm">Grave o primeiro áudio para começar</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">{msg.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <audio
                      src={msg.audio_url}
                      controls
                      className="h-10 w-48"
                    />
                    <button
                      onClick={() => deletarAudio(msg.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
