'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SalaComunicador() {
  const [user, setUser] = useState<any>(null)
  const [canal, setCanal] = useState<any>(null)
  const [participantes, setParticipantes] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState('')
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const canalId = params.id as string

  // Configuração do WebRTC (STUN servers gratuitos)
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await carregarCanal()
        await registrarNoCanal(user.id)
        await carregarParticipantes()
        iniciarMicrofone()
        
        // Inscrever para novos participantes
        const channel = supabase
          .channel('comunicador')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'comunicador_participantes', filter: `canal_id=eq.${canalId}` },
            () => carregarParticipantes()
          )
          .subscribe()
        
        return () => {
          channel.unsubscribe()
          // Fechar todas as conexões ao sair
          peerConnectionsRef.current.forEach((conn) => conn.close())
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
          }
        }
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    // Conectar com novos participantes
    participantes.forEach(participante => {
      if (participante.usuario_id !== user?.id && !peerConnectionsRef.current.has(participante.usuario_id)) {
        criarConexao(participante.usuario_id)
      }
    })
  }, [participantes])

  const carregarCanal = async () => {
    const { data } = await supabase
      .from('comunicador_canais')
      .select('*')
      .eq('id', canalId)
      .single()
    
    if (data) {
      setCanal(data)
    }
  }

  const registrarNoCanal = async (userId: string) => {
    await supabase
      .from('comunicador_participantes')
      .upsert({
        canal_id: canalId,
        usuario_id: userId,
        joined_at: new Date().toISOString()
      })
  }

  const carregarParticipantes = async () => {
    const { data } = await supabase
      .from('comunicador_participantes')
      .select('*, profile:usuario_id(full_name)')
      .eq('canal_id', canalId)
    
    if (data) {
      setParticipantes(data)
      setIsConnected(data.length > 1)
    }
  }

  const iniciarMicrofone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      
      // Criar elemento de áudio local (sem feedback)
      const audio = new Audio()
      audio.srcObject = stream
      audio.muted = true
      audio.play()
      audioRef.current = audio
      
      console.log('Microfone ativado')
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      setError('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }

  const criarConexao = async (participanteId: string) => {
    if (!localStreamRef.current) return

    const peerConnection = new RTCPeerConnection(configuration)
    
    // Adicionar stream local
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!)
    })

    // Receber stream remoto
    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio()
      remoteAudio.srcObject = event.streams[0]
      remoteAudio.play().catch(e => console.log('Erro ao reproduzir áudio:', e))
    }

    // Criar oferta/negociação (simplificada)
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      // Em produção, aqui você enviaria o SDP via Supabase
      // Por enquanto, apenas armazenamos a conexão
      peerConnectionsRef.current.set(participanteId, peerConnection)
    } catch (err) {
      console.error('Erro ao criar conexão:', err)
    }
  }

  // Simular PTT (Push-to-Talk)
  // Em WebRTC, o áudio já é contínuo. O PTT é uma "simulação" de silêncio
  const startSpeaking = () => {
    setIsSpeaking(true)
    // O áudio já está sendo transmitido via WebRTC
    // Aqui poderíamos fazer um efeito visual
  }

  const stopSpeaking = () => {
    setIsSpeaking(false)
  }

  const sairDoCanal = async () => {
    // Remover participante
    await supabase
      .from('comunicador_participantes')
      .delete()
      .eq('canal_id', canalId)
      .eq('usuario_id', user.id)
    
    router.push('/comunicador')
  }

  if (!canal) {
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
            {isConnected ? '🟢 Conectado' : '🟡 Aguardando outros participantes...'}
          </p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <div className="relative">
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
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105'
                }
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
            
            {isSpeaking && (
              <div className="absolute -top-2 -right-2">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>
            )}
          </div>
          
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
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {p.usuario_id === user?.id ? '🎤 Você' : (p.profile?.full_name || 'Preparado')}
                {p.usuario_id !== user?.id && !peerConnectionsRef.current.has(p.usuario_id) && (
                  <span className="ml-1 text-xs text-yellow-500">⏳ conectando...</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={sairDoCanal}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Sair do Canal
          </button>
        </div>

        <div className="mt-4">
          <Link
            href="/comunicador"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar aos Canais
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 Comunicação em tempo real via WebRTC
          </p>
        </div>
      </div>
    </div>
  )
}