'use client'

import React, { useState, useRef, useEffect } from 'react'

interface RadioPlayerProps {
  minimizado?: boolean
  onClose?: () => void
  integrado?: boolean
}

export default function RadioPlayer({ minimizado: inicialMinimizado = false, onClose, integrado = false }: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Conectado')
  const [minimizado, setMinimizado] = useState(inicialMinimizado)

  const STREAM_URL = 'https://painel.radiosms.com.br:8056/stream/'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = STREAM_URL
    audio.crossOrigin = 'anonymous'
    audio.volume = volume / 100

    const handlePlay = () => {
      setIsPlaying(true)
      setStatusText('Reproduzindo')
      setError(null)
    }

    const handlePause = () => {
      setIsPlaying(false)
      setStatusText('Pausado')
    }

    const handleError = () => {
      const errorCode = audio.error?.code
      let errorMsg = 'Erro ao conectar ao stream'

      switch (errorCode) {
        case 1:
          errorMsg = 'Carregamento abortado'
          break
        case 2:
          errorMsg = 'Erro de rede'
          break
        case 3:
          errorMsg = 'Carregamento interrompido'
          break
        case 4:
          errorMsg = 'Formato de áudio não suportado'
          break
        default:
          errorMsg = 'Erro desconhecido'
      }

      setError(errorMsg)
      setIsPlaying(false)
      setStatusText('Erro')
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setStatusText('Conectando')
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setError(null)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play().catch((err) => {
        setError('Erro ao reproduzir: ' + err.message)
      })
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const toggleMinimizado = () => {
    setMinimizado(!minimizado)
  }

  // Versão minimizada
  if (minimizado) {
    return (
      <div 
        onClick={toggleMinimizado}
        className="fixed bottom-20 right-4 z-30 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg p-3 flex items-center gap-2 cursor-pointer hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
      >
        <div className="relative">
          <div className={`w-3 h-3 bg-red-500 rounded-full absolute -top-1 -right-1 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="text-xl">📻</span>
        </div>
        <span className="text-sm font-medium">
          {isPlaying ? 'Tocando ao vivo' : statusText}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleMinimizado(); }}
          className="text-white/70 hover:text-white"
        >
          ⤢
        </button>
      </div>
    )
  }

  // Para uso integrado (no topo do Dashboard)
  if (integrado) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md overflow-hidden">
        <audio ref={audioRef} />
        
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📻</div>
              <div>
                <h3 className="font-bold">Rádio Diamante</h3>
                <p className="text-sm opacity-90">98.7 FM - Ao vivo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-xl disabled:opacity-50"
              >
                {isLoading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {onClose && (
                <button onClick={onClose} className="text-white/80 hover:text-white">
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-xs opacity-75">
            {error ? (
              <span className="text-yellow-200">⚠️ {error}</span>
            ) : isLoading ? (
              <span>⏳ Conectando...</span>
            ) : isPlaying ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Transmitindo ao vivo
              </span>
            ) : (
              <span>Clique em Play para ouvir</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Versão flutuante expandida (padrão)
  return (
    <div className="fixed bottom-20 right-4 z-30 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📻</span>
          <div>
            <h4 className="font-bold text-sm">Rádio Diamante</h4>
            <p className="text-xs opacity-90">98.7 FM - Ao vivo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleMinimizado} className="text-white/80 hover:text-white transition">−</button>
          {onClose && <button onClick={onClose} className="text-white/80 hover:text-white transition">✕</button>}
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <audio ref={audioRef} />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">
              {error ? 'Erro' : (isLoading ? 'Conectando...' : (isPlaying ? 'Ao vivo' : statusText))}
            </span>
          </div>
          <span className="text-xs text-gray-400">Diamante FM</span>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs rounded text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:from-purple-700 hover:to-indigo-700 transition shadow-md text-xl disabled:opacity-50"
          >
            {isLoading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          98.7 FM - Transmitindo ao vivo
        </p>
      </div>
    </div>
  )
}