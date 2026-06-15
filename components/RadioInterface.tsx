'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface GrupoCanal {
  id: number
  nome: string
  participantes: number
}

interface RadioInterfaceProps {
  canalAtualId: string
  onMudarCanal: (canalId: string, canalNome: string) => void
}

export default function RadioInterfaceSVG({ canalAtualId, onMudarCanal }: RadioInterfaceProps) {
  const [grupos, setGrupos] = useState<GrupoCanal[]>([])
  const [canalProximo, setCanalProximo] = useState({ participantes: 0 })
  const [canalAdmin, setCanalAdmin] = useState({ participantes: 0 })
  const [isOn, setIsOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [volume, setVolume] = useState(70)
  const [rangeKm, setRangeKm] = useState(50)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationRef = useRef<number>(0)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  // Posições dos elementos no SVG (você vai me passar as coordenadas)
  const positions = {
    btnOnOff: { top: '12%', right: '8%' },
    displayGrupos: { top: '18%', left: '6%', right: '35%' },
    sliderRange: { bottom: '22%', left: '6%', right: '45%' },
    sliderVolume: { bottom: '12%', left: '6%', right: '45%' },
    btnPtt: { bottom: '15%', right: '12%' },
    indicadorGravacao: { bottom: '28%', right: '12%' },
    indicadorOnOff: { top: '10%', right: '16%' },
    barraModulacao: { right: '8%', top: '50%' }
  }

  useEffect(() => {
    carregarUsuario()
    carregarGrupos()
    carregarCanalProximo()
    carregarCanalAdmin()
  }, [])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setIsAdmin(profile?.role === 'admin')
    }
  }

  const carregarGrupos = async () => {
    const { data } = await supabase
      .from('groups')
      .select('id, name, member_count')
      .gt('member_count', 0)
      .order('member_count', { ascending: false })

    if (data) {
      const gruposFormatados = data.map(g => ({
        id: g.id,
        nome: g.name.toUpperCase(),
        participantes: g.member_count
      }))
      setGrupos(gruposFormatados)
    }
  }

  const carregarCanalProximo = async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single()

    if (profile?.group_id) {
      const { data: grupoAtual } = await supabase
        .from('groups')
        .select('member_count')
        .eq('id', profile.group_id)
        .single()

      setCanalProximo({ participantes: grupoAtual?.member_count || 0 })
    }
  }

  const carregarCanalAdmin = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    setCanalAdmin({ participantes: count || 0 })
  }

  const startRecording = async () => {
    if (!isOn) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      source.connect(analyser)
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const level = Math.min(100, (average / 255) * 100)
        setAudioLevel(level)
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      
      updateLevel()
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('Audio a ser enviado:', audioBlob.size)
        stream.getTracks().forEach(track => track.stop())
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        setAudioLevel(0)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      tocarRogerBeep()
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording()
        }
      }, 15000)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      tocarRogerBeep()
    }
  }

  const tocarRogerBeep = () => {
    try {
      const audio = new Audio('/sounds/roger-beep.mp3')
      audio.volume = volume / 100
      audio.play().catch(e => console.log('Erro ao tocar beep:', e))
    } catch (err) {
      console.log('Erro ao reproduzir beep:', err)
    }
  }

  const mudarCanal = (canalId: number | string, canalNome: string) => {
    onMudarCanal(String(canalId), canalNome)
  }

  const ModulationBar = ({ level, isActive }: { level: number; isActive: boolean }) => {
    return (
      <div className="flex items-end gap-[2px] h-8">
        {isActive ? (
          [...Array(8)].map((_, i) => {
            const barHeight = Math.min(100, Math.max(10, level * (i + 1) / 2))
            return (
              <div
                key={i}
                className="w-1 bg-[#FFB800] rounded-full transition-all duration-75"
                style={{ 
                  height: `${barHeight}%`,
                  opacity: level > (i * 12) ? 1 : 0.3
                }}
              />
            )
          })
        ) : (
          <div className="w-10 h-8 flex items-center justify-center">
            <span className="text-xs text-gray-500">--</span>
          </div>
        )}
      </div>
    )
  }

  const RadioChannelRow = ({ 
    nome, 
    participantes, 
    isCurrent, 
    onSelect,
    showModulation = false,
    modulationLevel = 0
  }: { 
    nome: string
    participantes: number
    isCurrent: boolean
    onSelect: () => void
    showModulation?: boolean
    modulationLevel?: number
  }) => {
    return (
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
          isCurrent 
            ? 'bg-[#FFB800] bg-opacity-20 border-l-4 border-[#FFB800]' 
            : 'hover:bg-gray-800 hover:bg-opacity-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-white w-8 text-right">
            {String(participantes).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-white">
            {nome}
          </span>
          {isCurrent && (
            <span className="text-xs text-[#FFB800]">▶</span>
          )}
        </div>
        
        {showModulation && (
          <ModulationBar level={modulationLevel} isActive={isRecording && isCurrent} />
        )}
      </button>
    )
  }

  return (
    <div ref={svgContainerRef} className="relative w-full max-w-md mx-auto">
      {/* SVG de fundo */}
      <img 
        src="/images/comunicador/radio-interface.svg"
        alt="Interface do Radio"
        className="w-full h-auto pointer-events-none"
        onError={(e) => {
          console.error('Erro ao carregar SVG:', e)
          e.currentTarget.style.display = 'none'
        }}
      />
      
      {/* Overlay interativo sobre o SVG */}
      <div className="absolute inset-0">
        {/* Botão On/Off */}
        <div className="absolute" style={{ top: positions.btnOnOff.top, right: positions.btnOnOff.right }}>
          <button
            onClick={() => setIsOn(!isOn)}
            className="w-10 h-5 rounded-full transition bg-gray-600"
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Lista de canais (display) */}
        <div 
          className="absolute overflow-y-auto" 
          style={{ 
            top: positions.displayGrupos.top, 
            left: positions.displayGrupos.left, 
            right: positions.displayGrupos.right,
            maxHeight: '45%'
          }}
        >
          {grupos.map((grupo) => (
            <RadioChannelRow
              key={grupo.id}
              nome={grupo.nome}
              participantes={grupo.participantes}
              isCurrent={String(grupo.id) === canalAtualId}
              onSelect={() => mudarCanal(grupo.id, grupo.nome)}
              showModulation={String(grupo.id) === canalAtualId}
              modulationLevel={audioLevel}
            />
          ))}
          
          <RadioChannelRow
            nome="PESSOAS PROXIMAS"
            participantes={canalProximo.participantes}
            isCurrent={canalAtualId === 'proximas'}
            onSelect={() => mudarCanal('proximas', 'PESSOAS PROXIMAS')}
            showModulation={canalAtualId === 'proximas'}
            modulationLevel={audioLevel}
          />
          
          {isAdmin && (
            <RadioChannelRow
              nome="ADMIN"
              participantes={canalAdmin.participantes}
              isCurrent={canalAtualId === 'admin'}
              onSelect={() => mudarCanal('admin', 'ADMIN')}
              showModulation={canalAtualId === 'admin'}
              modulationLevel={audioLevel}
            />
          )}
        </div>

        {/* Slider Range [Km] */}
        <div className="absolute" style={{ bottom: positions.sliderRange.bottom, left: positions.sliderRange.left, right: positions.sliderRange.right }}>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={rangeKm}
            onChange={(e) => setRangeKm(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#FFB800' }}
          />
        </div>

        {/* Slider Volume */}
        <div className="absolute" style={{ bottom: positions.sliderVolume.bottom, left: positions.sliderVolume.left, right: positions.sliderVolume.right }}>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#FFB800' }}
          />
        </div>

        {/* Botão PTT (Microfone) */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className="absolute w-14 h-14 rounded-full bg-gray-700 active:bg-red-500 transition flex items-center justify-center cursor-pointer"
          style={{ bottom: positions.btnPtt.bottom, right: positions.btnPtt.right }}
          disabled={!isOn}
        >
          <span className="text-2xl">🎤</span>
        </button>

        {/* Indicador de gravação */}
        {isRecording && (
          <div className="absolute flex items-center gap-1" style={{ bottom: positions.indicadorGravacao.bottom, right: positions.indicadorGravacao.right }}>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-red-500">REC</span>
          </div>
        )}

        {/* Indicador ON/OFF */}
        <div className="absolute" style={{ top: positions.indicadorOnOff.top, right: positions.indicadorOnOff.right }}>
          <span className={`text-xs font-bold ${isOn ? 'text-green-500' : 'text-red-500'}`}>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  )
}