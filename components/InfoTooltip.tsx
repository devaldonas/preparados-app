'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

interface InfoTooltipProps {
  descricao: string
}

export default function InfoTooltip({ descricao }: InfoTooltipProps) {
  const [aberto, setAberto] = useState(false)

  if (!descricao) return null

  return (
    <div className="flex items-center">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-6 h-6 rounded-full bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center hover:bg-[#FFB800]/30 transition flex-shrink-0 hover:scale-110"
        type="button"
        aria-label="Ver descrição"
      >
        <Info size={14} />
      </button>

      {aberto && (
        <div className="ml-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-700 leading-relaxed flex-1">{descricao}</p>
            <button
              onClick={() => setAberto(false)}
              className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}