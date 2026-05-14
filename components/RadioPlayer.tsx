'use client'

import { useState } from 'react'

interface RadioPlayerProps {
  minimizado?: boolean
  onClose?: () => void
  integrado?: boolean
}

export default function RadioPlayer({ minimizado: inicialMinimizado = false, onClose, integrado = false }: RadioPlayerProps) {
  const [minimizado, setMinimizado] = useState(inicialMinimizado)

  const toggleMinimizado = () => {
    setMinimizado(!minimizado)
  }

  // Versão minimizada (apenas ícone)
  if (integrado && minimizado) {
    return (
      <div className="bg-gradient-to-r from-preparados-blue to-blue-800 text-white rounded-xl p-3 flex items-center justify-between cursor-pointer hover:from-green-700 hover:to-emerald-700 transition" onClick={toggleMinimizado}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PREPARADOS" className="h-6 w-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span className="text-sm font-medium">Rádio Diamante</span>
        </div>
        <button className="text-white/80 hover:text-white" onClick={(e) => { e.stopPropagation(); toggleMinimizado(); }}>▼</button>
      </div>
    )
  }

  // Versão expandida integrada (topo do Dashboard)
  if (integrado && !minimizado) {
    return (
      <div className="bg-gradient-to-r from-preparados-blue to-blue-800 text-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="PREPARADOS" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <div>
                <h3 className="font-bold">Rádio Diamante</h3>
                <p className="text-sm opacity-90">98.7 FM - Ao vivo</p>
              </div>
            </div>
            
            <a
              href="https://fmdiamante.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <span>🎙️ Ouvir no Site</span>
              <span>→</span>
            </a>
            
            {onClose && (
              <button onClick={onClose} className="text-white/80 hover:text-white">
                ✕
              </button>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-xs opacity-75">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Stream temporariamente indisponível - Clique no botão para ouvir
          </div>
        </div>
      </div>
    )
  }

  // Versão flutuante minimizada
  if (minimizado) {
    return (
      <div 
        onClick={toggleMinimizado}
        className="fixed bottom-20 right-4 z-30 bg-gradient-to-r from-preparados-blue to-blue-800 text-white rounded-full shadow-lg p-3 flex items-center gap-2 cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
      >
        <img src="/logo.svg" alt="PREPARADOS" className="h-5 w-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <span className="text-sm font-medium">Rádio Diamante</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleMinimizado(); }}
          className="text-white/70 hover:text-white"
        >
          ⤢
        </button>
      </div>
    )
  }

  // Versão flutuante expandida
  return (
    <div className="fixed bottom-20 right-4 z-30 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-preparados-blue to-blue-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PREPARADOS" className="h-6 w-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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

      <div className="p-4 bg-gray-50 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-500">Stream offline</span>
        </div>
        
        <a
          href="https://fmdiamante.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-preparados-blue to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition inline-flex items-center gap-2"
        >
          <span>🎙️ Acessar Site da Rádio</span>
          <span>→</span>
        </a>
        
        <p className="text-xs text-gray-500 mt-3">
          Informações e orientações 24h
        </p>
      </div>
    </div>
  )
}