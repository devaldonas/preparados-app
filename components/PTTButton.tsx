'use client'

import { useState, useRef, useEffect } from 'react'

interface PTTButtonProps {
  onStartSpeaking: () => void
  onStopSpeaking: () => void
  disabled?: boolean
}

export default function PTTButton({ onStartSpeaking, onStopSpeaking, disabled }: PTTButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])

  const handleTouchStart = () => {
    if (disabled) return
    setIsSpeaking(true)
    onStartSpeaking()
  }

  const handleTouchEnd = () => {
    if (disabled) return
    setIsSpeaking(false)
    onStopSpeaking()
  }

  // Para desenvolvimento em desktop (mouse)
  const handleMouseDown = () => {
    if (disabled || isMobile) return
    setIsSpeaking(true)
    onStartSpeaking()
  }

  const handleMouseUp = () => {
    if (disabled || isMobile) return
    setIsSpeaking(false)
    onStopSpeaking()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        className={`
          w-32 h-32 rounded-full shadow-xl transition-all duration-100
          ${isSpeaking 
            ? 'bg-red-600 scale-95 shadow-inner' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          active:scale-95
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-4xl">{isSpeaking ? '🎤' : '🎙️'}</span>
          <span className="text-sm font-semibold mt-2">
            {isSpeaking ? 'FALANDO...' : 'Pressione para falar'}
          </span>
        </div>
      </button>
      <p className="text-xs text-gray-500">
        {isMobile 
          ? 'Pressione e segure para falar, solte para ouvir' 
          : 'Clique e segure para falar, solte para ouvir'}
      </p>
    </div>
  )
}