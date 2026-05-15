'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SalaComunicador() {
  const [user, setUser] = useState<any>(null)
  const [canal, setCanal] = useState<any>(null)
  const [participantes, setParticipantes] = useState<any[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState('')
  const [conectado, setConectado] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const canalId = params.id as string

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }

  const gerarRogerBeep = () => {
    try {
      if (audioContextRef.current) audioContextRef.current.close()
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 880
      gainNode.gain.value = 0.25
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.25)
      oscillator.stop(audioContext.currentTime + 0.25)
      setTimeout(() => {
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }, 400)
    } catch (err) {
      console.log('Erro ao gerar roger beep:', err)
    }
  }

  // Carregar usuário primeiro
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Usuário logado:', user?.id)
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      await carregarCanal()
    }
    getUser()
  }, [])

  // Depois que o usuário e canal estão carregados, registrar e iniciar
  useEffect(() => {
    if (!user || !canal) return
    
    const init = async () => {
      await registrarNoCanal()
      await carregarParticipantes()
      await iniciarMicrofone()
      setLoading(false)
    }
    init()
    
    // Inscrever para mudanças
    const subscription = supabase
      .channel('participantes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comunicador_participantes', filter: `canal_id=eq.${canalId}` },
        () => carregarParticipantes()
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
      peerConnectionsRef.current.forEach((conn) => conn.close())
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [user, canal])

  // Conectar com outros participantes
  useEffect(() => {
    if (!user || !localStreamRef.current || participantes.length === 0) return
    
    const outrosParticipantes = participantes.filter(p => p.usuario_id !== user.id)
    outrosParticipantes.forEach(participante => {
      if (!peerConnectionsRef.current.has(participante.usuario_id)) {
        console.log('Criando conexão com:', participante.usuario_id)
        criarConexao(participante.usuario_id)
      }
    })
  }, [participantes, user, localStreamRef.current])

  const carregarCanal = async () => {
    const { data } = await supabase
      .from('comunicador_canais')
      .select('*')
      .eq('id', canalId)
      .single()
    if (data) setCanal(data)
    else console.error('Canal não encontrado')
  }

  const registrarNoCanal = async () => {
  if (!user) {
    console.error('Usuário não carregado')
    return
  }
  
  console.log('Registrando no canal:', canalId, 'Usuário:', user.id)
  
  // Buscar nome do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  
  const fullName = profile?.full_name || 'Preparado'
  
  // Deletar registros antigos
  await supabase
    .from('comunicador_participantes')
    .delete()
    .eq('canal_id', canalId)
    .eq('usuario_id', user.id)
  
  // Inserir novo registro
  const { error } = await supabase
    .from('comunicador_participantes')
    .insert({
      canal_id: canalId,
      usuario_id: user.id,
      full_name: fullName,
      joined_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Erro ao inserir:', error)
    setError('Erro ao entrar no canal')
  } else {
    console.log('Registrado com sucesso')
  }
}

  const carregarParticipantes = async () => {
  const { data, error } = await supabase
    .from('comunicador_participantes')
    .select('*')
    .eq('canal_id', canalId)
  
  if (error) {
    console.error('Erro ao carregar participantes:', error)
    return
  }
  
  if (data) {
    console.log('Participantes:', data.length)
    setParticipantes(data)
    setConectado(data.length > 1)
  }
}

  const iniciarMicrofone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      console.log('Microfone ativado')
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      setError('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }

  const criarConexao = async (remoteUserId: string) => {
    if (!localStreamRef.current) return
    if (peerConnectionsRef.current.has(remoteUserId)) return

    const peerConnection = new RTCPeerConnection(configuration)
    peerConnectionsRef.current.set(remoteUserId, peerConnection)

    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!)
    })

    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio()
      remoteAudio.srcObject = event.streams[0]
      remoteAudio.play().catch(e => console.log('Erro ao reproduzir:', e))
    }

    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
    } catch (err) {
      console.error('Erro ao criar offer:', err)
    }
  }

  const startSpeaking = () => setIsSpeaking(true)
  const stopSpeaking = () => {
    setIsSpeaking(false)
    gerarRogerBeep()
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
            {conectado ? '🟢 Conectado' : '🟡 Aguardando outros participantes...'}
          </p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <button
            onMouseDown={startSpeaking}
            onMouseUp={stopSpeaking}
            onMouseLeave={stopSpeaking}
            onTouchStart={startSpeaking}
            onTouchEnd={stopSpeaking}
            className={`
              w-40 h-40 rounded-full shadow-xl transition-all duration-100
              ${isSpeaking 
                ? 'bg-red-600 scale-95 shadow-inner' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105'}
              cursor-pointer active:scale-95
            `}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-5xl">{isSpeaking ? '🎤' : '🎙️'}</span>
              <span className="text-sm font-semibold mt-2 text-white">
                {isSpeaking ? 'FALANDO...' : 'Pressione para falar'}
              </span>
            </div>
          </button>
          
          <p className="text-sm text-gray-500 mt-6">
            Pressione e segure o botão para falar.<br/>
            Solte para ouvir os outros.
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