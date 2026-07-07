'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Radio, Minimize2, Maximize2, X } from 'lucide-react'

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
  const [isMuted, setIsMuted] = useState(false)

  // 🔥 URL CORRETA (sem a barra no final)
  const STREAM_URL = 'https://painel.radiosms.com.br:8056/stream'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // 🔥 TENTAR DIRETO PRIMEIRO
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
          errorMsg = 'Erro de rede - tentando reconectar...'
          break
        case 3:
          errorMsg = 'Carregamento interrompido'
          break
        case 4:
          errorMsg = 'Formato de áudio não suportado'
          break
        default:
          errorMsg = 'Erro desconhecido - tente novamente'
      }

      setError(errorMsg)
      setIsPlaying(false)
      setStatusText('Erro')
      
      // 🔥 TENTAR RECONECTAR APÓS 5 SEGUNDOS
      setTimeout(() => {
        if (audio) {
          audio.src = STREAM_URL
          audio.load()
        }
      }, 5000)
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
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const toggleMinimizado = () => {
    setMinimizado(!minimizado)
  }

  // VERSÃO MINIMIZADA
  if (minimizado) {
    return (
      <div 
        className="fixed bottom-20 right-4 z-30 bg-white rounded-full shadow-lg border border-[#FFB800]/20 p-2 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-all duration-300"
        onClick={toggleMinimizado}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FFB800] to-[#E5A600] flex items-center justify-center text-white shadow-md">
            <Radio size={18} />
          </div>
          {isPlaying && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
          )}
        </div>
        <div className="pr-2">
          <p className="text-xs font-semibold text-gray-800">Rádio Diamante</p>
          <p className="text-[10px] text-gray-500">
            {isPlaying ? '🔴 Ao vivo' : statusText}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleMinimizado(); }}
          className="text-gray-400 hover:text-gray-600 transition p-1"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    )
  }

  // VERSÃO INTEGRADA (DASHBOARD)
  if (integrado) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <audio ref={audioRef} />
        
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#E5A600] flex items-center justify-center text-white shadow-md">
                <Radio size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Rádio Diamante</h3>
                <p className="text-xs text-gray-500">98.7 FM - Ao vivo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-[#FFB800] hover:bg-[#E5A600] text-black flex items-center justify-center transition shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause size={18} fill="black" />
                ) : (
                  <Play size={18} fill="black" className="ml-0.5" />
                )}
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-gray-500 hover:text-gray-700 transition">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                />
              </div>
              
              {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-[#FFB800] to-[#E5A600] rounded-full transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} />
            </div>
            <span className="text-xs text-gray-400">
              {error ? (
                <span className="text-red-500">⚠️ {error}</span>
              ) : isLoading ? (
                <span className="text-yellow-500">⏳ Conectando...</span>
              ) : isPlaying ? (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Ao vivo
                </span>
              ) : (
                <span className="text-gray-400">Pausado</span>
              )}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // VERSÃO FLUTUANTE EXPANDIDA
  return (
    <div className="fixed bottom-20 right-4 z-30 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#FFB800] to-[#E5A600] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <Radio size={20} />
          </div>
          <div>
            <h4 className="font-bold text-black">Rádio Diamante</h4>
            <p className="text-xs text-black/70">98.7 FM - Ao vivo</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleMinimizado} className="text-black/70 hover:text-black transition p-1">
            <Minimize2 size={16} />
          </button>
          {onClose && (
            <button onClick={onClose} className="text-black/70 hover:text-black transition p-1">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 bg-gray-50">
        <audio ref={audioRef} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-600">
              {error ? '⚠️ Erro' : (isLoading ? '⏳ Conectando...' : (isPlaying ? '🔴 Ao vivo' : statusText))}
            </span>
          </div>
          <span className="text-xs text-gray-400">Diamante FM</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
            {error}
            <button 
              onClick={() => {
                setError(null)
                setIsLoading(true)
                if (audioRef.current) {
                  audioRef.current.src = STREAM_URL
                  audioRef.current.load()
                }
              }}
              className="ml-2 text-red-600 font-semibold hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FFB800] to-[#E5A600] text-black flex items-center justify-center hover:shadow-lg transition shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} fill="black" />
            ) : (
              <Play size={24} fill="black" className="ml-1" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="text-gray-500 hover:text-gray-700 transition">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#FFB800]"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{isMuted ? 0 : volume}%</span>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          📻 98.7 FM - Transmitindo ao vivo
        </p>
      </div>
    </div>
  )
}