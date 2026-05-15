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
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const channelRef = useRef<any>(null)
  
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
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
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
        await iniciarMicrofone()
        setupRealtimeListeners()
        
        return () => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
          }
          peerConnectionsRef.current.forEach((conn) => conn.close())
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
          }
        }
      }
    }
    getUser()
  }, [])

  // Quando a lista de participantes muda, conectar com novatos
  useEffect(() => {
    if (!user) return
    
    const usuariosExistentes = Array.from(peerConnectionsRef.current.keys())
    
    participantes.forEach(participante => {
      const participanteId = participante.usuario_id
      if (participanteId !== user.id && !peerConnectionsRef.current.has(participanteId)) {
        console.log('Conectando com:', participanteId)
        iniciarConexao(participanteId)
      }
    })
    
    // Limpar conexões com usuários que saíram
    participantes.forEach(p => {
      if (p.usuario_id !== user.id && !usuariosExistentes.includes(p.usuario_id)) {
        // Usuário saiu, fechar conexão se existir
        const conn = peerConnectionsRef.current.get(p.usuario_id)
        if (conn) {
          conn.close()
          peerConnectionsRef.current.delete(p.usuario_id)
        }
      }
    })
  }, [participantes])

  const carregarCanal = async () => {
    const { data } = await supabase
      .from('comunicador_canais')
      .select('*')
      .eq('id', canalId)
      .single()
    if (data) setCanal(data)
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

  const setupRealtimeListeners = () => {
    // Escutar convites (offers)
    channelRef.current = supabase
      .channel(`webrtc:${canalId}`)
      .on('broadcast', { event: 'webrtc-offer' }, async ({ payload }) => {
        console.log('Recebendo offer de:', payload.from)
        await handleOffer(payload)
      })
      .on('broadcast', { event: 'webrtc-answer' }, async ({ payload }) => {
        console.log('Recebendo answer de:', payload.from)
        await handleAnswer(payload)
      })
      .on('broadcast', { event: 'webrtc-candidate' }, async ({ payload }) => {
        console.log('Recebendo candidate de:', payload.from)
        await handleCandidate(payload)
      })
      .subscribe()
  }

  const broadcast = (event: string, data: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: event,
      payload: data
    })
  }

  const iniciarConexao = async (remoteUserId: string) => {
    if (!localStreamRef.current) return
    if (peerConnectionsRef.current.has(remoteUserId)) return

    console.log('Iniciando conexão com:', remoteUserId)
    
    const peerConnection = new RTCPeerConnection(configuration)
    peerConnectionsRef.current.set(remoteUserId, peerConnection)

    // Adicionar stream local
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!)
    })

    // Receber stream remoto
    peerConnection.ontrack = (event) => {
      console.log('Recebendo stream remoto')
      const remoteAudio = new Audio()
      remoteAudio.srcObject = event.streams[0]
      remoteAudio.play().catch(e => console.log('Erro ao reproduzir:', e))
    }

    // Enviar candidatos ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        broadcast('webrtc-candidate', {
          from: user.id,
          to: remoteUserId,
          candidate: event.candidate
        })
      }
    }

    // Criar offer
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      broadcast('webrtc-offer', {
        from: user.id,
        to: remoteUserId,
        offer: offer
      })
    } catch (err) {
      console.error('Erro ao criar offer:', err)
    }
  }

  const handleOffer = async (payload: any) => {
    if (payload.to !== user.id) return
    if (peerConnectionsRef.current.has(payload.from)) return

    console.log('Processando offer de:', payload.from)
    
    const peerConnection = new RTCPeerConnection(configuration)
    peerConnectionsRef.current.set(payload.from, peerConnection)

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!)
      })
    }

    peerConnection.ontrack = (event) => {
      console.log('Recebendo stream remoto via offer')
      const remoteAudio = new Audio()
      remoteAudio.srcObject = event.streams[0]
      remoteAudio.play().catch(e => console.log('Erro ao reproduzir:', e))
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        broadcast('webrtc-candidate', {
          from: user.id,
          to: payload.from,
          candidate: event.candidate
        })
      }
    }

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      broadcast('webrtc-answer', {
        from: user.id,
        to: payload.from,
        answer: answer
      })
    } catch (err) {
      console.error('Erro ao responder offer:', err)
    }
  }

  const handleAnswer = async (payload: any) => {
    if (payload.to !== user.id) return
    
    const peerConnection = peerConnectionsRef.current.get(payload.from)
    if (!peerConnection) return

    console.log('Processando answer de:', payload.from)
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer))
    } catch (err) {
      console.error('Erro ao processar answer:', err)
    }
  }

  const handleCandidate = async (payload: any) => {
    if (payload.to !== user.id) return
    
    const peerConnection = peerConnectionsRef.current.get(payload.from)
    if (!peerConnection) return

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
    } catch (err) {
      console.error('Erro ao adicionar candidate:', err)
    }
  }

  const startSpeaking = () => {
    setIsSpeaking(true)
  }

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
            {participantes.length > 1 ? '🟢 Conectado' : '🟡 Aguardando outros participantes...'}
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
                  : 'bg-green-100 text-green-700'
              }`}>
                {p.usuario_id === user?.id ? '🎤 Você' : (p.profile?.full_name || 'Preparado')}
              </span>
            ))}
          </div>
          {participantes.length === 1 && (
            <p className="text-xs text-yellow-600 mt-2 text-center">
              ⏳ Aguardando mais participantes. Compartilhe o link com outros Preparados!
            </p>
          )}
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
      </div>
    </div>
  )
}