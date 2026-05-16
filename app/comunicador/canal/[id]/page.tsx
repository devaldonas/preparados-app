'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SalaComunicador() {
  const [user, setUser] = useState<any>(null)
  const [canal, setCanal] = useState<any>(null)
  const [participantes, setParticipantes] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [audioURLs, setAudioURLs] = useState<{ id: string; url: string; from: string }[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const canalId = params.id as string

  const gerarRogerBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 880
    gainNode.gain.value = 0.3
    
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3)
    oscillator.stop(audioContext.currentTime + 0.3)
    
    setTimeout(() => audioContext.close(), 400)
  } catch (err) {
    console.log('Erro ao gerar beep:', err)
  }
}

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      await carregarCanal()
      await registrarNoCanal()
      await carregarParticipantes()
      setLoading(false)
      
      // Inscrever para novos áudios
      const channel = supabase
        .channel(`audio:${canalId}`)
        .on('broadcast', { event: 'novo-audio' }, (payload) => {
          console.log('Áudio recebido:', payload)
          adicionarAudio(payload.payload)
        })
        .subscribe()
      
      // Inscrever para participantes
      const participantSubscription = supabase
        .channel('participantes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'comunicador_participantes', filter: `canal_id=eq.${canalId}` },
          () => carregarParticipantes()
        )
        .subscribe()
      
      return () => {
        channel.unsubscribe()
        participantSubscription.unsubscribe()
      }
    }
    getUser()
  }, [])

  const carregarCanal = async () => {
    const { data } = await supabase
      .from('comunicador_canais')
      .select('*')
      .eq('id', canalId)
      .single()
    if (data) setCanal(data)
  }

  const registrarNoCanal = async () => {
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    const fullName = profile?.full_name || 'Preparado'
    
    await supabase
      .from('comunicador_participantes')
      .delete()
      .eq('canal_id', canalId)
      .eq('usuario_id', user.id)
    
    await supabase
      .from('comunicador_participantes')
      .insert({
        canal_id: canalId,
        usuario_id: user.id,
        full_name: fullName,
        joined_at: new Date().toISOString()
      })
  }

  const carregarParticipantes = async () => {
    const { data } = await supabase
      .from('comunicador_participantes')
      .select('*')
      .eq('canal_id', canalId)
    
    if (data) {
      setParticipantes(data)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await enviarAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Parar automaticamente após 15 segundos
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording()
        }
      }, 15000)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      setError('Não foi possível acessar o microfone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      gerarRogerBeep()
    }
  }

  const enviarAudio = async (audioBlob: Blob) => {
    if (!user) return
    
    const fileName = `${Date.now()}_${user.id}.webm`
    const filePath = `audio/${fileName}`
    
    // Upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('comunicador_audio')
      .upload(filePath, audioBlob, { contentType: 'audio/webm' })
    
    if (uploadError) {
      console.error('Erro ao enviar áudio:', uploadError)
      return
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('comunicador_audio')
      .getPublicUrl(filePath)
    
    // Broadcast para todos no canal
    supabase.channel(`audio:${canalId}`).send({
      type: 'broadcast',
      event: 'novo-audio',
      payload: {
        id: fileName,
        url: urlData.publicUrl,
        from: user.id,
        fromName: participantes.find(p => p.usuario_id === user.id)?.full_name || 'Preparado',
        timestamp: Date.now()
      }
    })
    
  }

  const adicionarAudio = (payload: any) => {
  // Ignorar se for o próprio usuário
  if (payload.from === user?.id) {
    console.log('Ignorando próprio áudio')
    return
  }
  
  setAudioURLs(prev => [...prev, {
    id: payload.id,
    url: payload.url,
    from: payload.fromName || 'Preparado'
  }])
  
  const audio = new Audio(payload.url)
  audio.play().catch(e => console.log('Erro ao reproduzir:', e))
}

  const sairDoCanal = async () => {
    await supabase
      .from('comunicador_participantes')
      .delete()
      .eq('canal_id', canalId)
      .eq('usuario_id', user.id)
    router.push('/comunicador')
  }

  if (loading || !canal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-preparados-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📻</div>
          <h1 className="text-2xl font-bold text-preparados-blue mb-2">{canal.nome}</h1>
          <p className="text-gray-600 text-sm">
            {participantes.length > 1 ? '🟢 Conectado' : '🟡 Aguardando outros participantes...'}
          </p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`
              w-40 h-40 rounded-full shadow-xl transition-all duration-100
              ${isRecording 
                ? 'bg-red-600 scale-95 shadow-inner animate-pulse' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105'}
              cursor-pointer active:scale-95
            `}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-5xl">{isRecording ? '🎤' : '🎙️'}</span>
              <span className="text-sm font-semibold mt-2 text-white">
                {isRecording ? 'GRAVANDO...' : 'Pressione para falar'}
              </span>
            </div>
          </button>
          
          <p className="text-sm text-gray-500 mt-6">
            Pressione e segure para gravar (máximo 15 segundos).<br/>
            Solte para enviar.
          </p>
        </div>

        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-2">📡 Neste canal ({participantes.length} participante(s)):</h3>
          <div className="flex flex-wrap gap-2">
            {participantes.map((p) => (
              <span key={p.id} className={`px-3 py-1 rounded-full text-sm ${
                p.usuario_id === user?.id 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {p.usuario_id === user?.id ? '🎤 Você' : (p.full_name || 'Preparado')}
              </span>
            ))}
          </div>
        </div>

        {/* Histórico de mensagens de áudio */}
        {audioURLs.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-700 mb-2">📨 Últimas mensagens:</h3>
            <div className="space-y-2">
              {audioURLs.slice(-5).reverse().map((audio) => (
                <div key={audio.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-preparados-blue">{audio.from}:</span>
                  <audio controls src={audio.url} className="h-8 w-48" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <button onClick={sairDoCanal} className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition">
            Sair do Canal
          </button>
        </div>

        <div className="mt-4">
          <Link href="/comunicador" className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition">
            Voltar aos Canais
          </Link>
        </div>
      </div>
    </div>
  )
}