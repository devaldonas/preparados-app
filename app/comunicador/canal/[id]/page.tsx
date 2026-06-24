'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// Silenciar erro específico do Supabase Realtime
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('cannot add `postgres_changes` callbacks')) return
  if (args[0]?.includes?.('after `subscribe()`')) return
  originalConsoleError(...args)
}

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
  
  const router = useRouter()
  const params = useParams()
  const canalId = params.id as string

  const gerarRogerBeep = () => {
    try {
      const audio = new Audio('/sounds/roger-beep.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Erro ao tocar beep:', e))
    } catch (err) {
      console.log('Erro ao reproduzir beep:', err)
    }
  }

  const gerarBeepRecebido = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 660
      gainNode.gain.value = 0.2
      
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2)
      oscillator.stop(audioContext.currentTime + 0.2)
      
      setTimeout(() => audioContext.close(), 300)
    } catch (err) {
      console.log('Erro ao gerar beep de recepção:', err)
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
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!user || !canal) return

    const audioChannel = supabase
      .channel(`audio:${canalId}`)
      .on('broadcast', { event: 'novo-audio' }, (payload) => {
        console.log('Áudio recebido:', payload)
        adicionarAudio(payload.payload)
      })
      .subscribe()

    const participantChannel = supabase
      .channel('participantes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comunicador_participantes', filter: `canal_id=eq.${canalId}` },
        () => carregarParticipantes()
      )
      .subscribe()

    return () => {
      audioChannel.unsubscribe()
      participantChannel.unsubscribe()
    }
  }, [user, canal, canalId])

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
    
    const { error: uploadError } = await supabase.storage
      .from('comunicador_audio')
      .upload(filePath, audioBlob, { contentType: 'audio/webm' })
    
    if (uploadError) {
      console.error('Erro ao enviar áudio:', uploadError)
      return
    }
    
    const { data: urlData } = supabase.storage
      .from('comunicador_audio')
      .getPublicUrl(filePath)
    
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
    if (payload.from === user?.id) {
      console.log('Ignorando próprio áudio')
      return
    }
    
    gerarBeepRecebido()
    
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Header com ícone do comunicador */}
        <div className="text-center mb-8">
          <img 
            src="/images/comunicador-icon.png" 
            alt="Comunicador" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <h1 className="text-2xl font-bold text-black mb-2">Comunicador Via Rádio</h1>
          <p className="text-gray-600 text-sm">Canal: Geral - Emergência</p>
          <p className="text-gray-600 text-sm">
            {participantes.length > 1 ? '🟢 Conectado' : '🟡 Aguardando outros participantes...'}
          </p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Botão PTT com imagem personalizada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
         <button
  onMouseDown={startRecording}
  onMouseUp={stopRecording}
  onMouseLeave={stopRecording}
  onTouchStart={startRecording}
  onTouchEnd={stopRecording}
  className="cursor-pointer focus:outline-none transition-transform active:scale-95 select-none"
  style={{ 
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation'
  }}
  draggable={false}
  onDragStart={(e) => e.preventDefault()}
>
  <img 
    src="/images/botaoptt.png" 
    alt="Push to Talk" 
    className="w-48 h-48 mx-auto object-contain pointer-events-none"
    draggable={false}
    onDragStart={(e) => e.preventDefault()}
  />
</button>
          
          <p className="text-sm text-gray-500 mt-6">
            Pressione e segure para gravar (máximo 15 segundos).<br/>
            Solte para enviar.
          </p>
          
          <div className="mt-3 text-xs text-gray-400">
            🔘 Ao soltar o botão, um "Roger Beep" indica o fim da transmissão
          </div>
          
          {isRecording && (
            <div className="mt-3 inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Gravando...
            </div>
          )}
        </div>

        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-2">📡 Neste canal ({participantes.length} participante(s)):</h3>
          <div className="flex flex-wrap gap-2">
            {participantes.map((p) => (
              <span key={p.id} className={`px-3 py-1 rounded-full text-sm ${
                p.usuario_id === user?.id 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-200 text-gray-700'
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
                  <span className="font-medium text-black">{audio.from}:</span>
                  <audio controls src={audio.url} className="h-8 w-48" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="mt-8 space-y-3">
          <button
            onClick={sairDoCanal}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Sair do Canal
          </button>
          
          <Link
            href="/comunicador"
            className="block text-center bg-[#FFB800] text-black py-3 px-4 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            Voltar aos Canais
          </Link>
        </div>
      </div>
    </div>
  )
}