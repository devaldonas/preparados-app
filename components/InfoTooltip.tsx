'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  descricao: string
}

export default function InfoTooltip({ descricao }: InfoTooltipProps) {
  const [aberto, setAberto] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAberto(!aberto)
  }

  if (!descricao) return null

  return (
    <div className="relative inline-block">
      {/* Botão */}
      <button
        onClick={handleToggle}
        className="w-7 h-7 rounded-full bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center hover:bg-[#FFB800]/30 transition flex-shrink-0 hover:scale-110"
        type="button"
        aria-label="Ver descrição"
      >
        <Info size={16} />
      </button>

      {/* Tooltip */}
      {aberto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />
          
          {/* Conteúdo do Tooltip */}
          <div 
            className="absolute z-50 w-80 max-w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 p-5 text-left"
            style={{
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              minWidth: '250px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2">
              <span className="text-[#FFB800] text-lg flex-shrink-0">📌</span>
              <p className="text-sm text-gray-700 leading-relaxed">{descricao}</p>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition w-full text-center"
            >
              Clique para fechar
            </button>
          </div>
        </>
      )}
    </div>
  )
}