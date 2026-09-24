'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'

interface InfoTooltipProps {
  descricao: string
}

export default function InfoTooltip({ descricao }: InfoTooltipProps) {
  const [aberto, setAberto] = useState(false)
  const [posicao, setPosicao] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const calcularPosicao = useCallback(() => {
    if (!botaoRef.current) return
    const rect = botaoRef.current.getBoundingClientRect()
    const larguraPopover = 320
    const alturaPopover = 240

    // Alinhar à direita do botão
    let left = rect.right - larguraPopover
    if (left < 8) {
      left = rect.left
    }
    if (left + larguraPopover > window.innerWidth - 8) {
      left = window.innerWidth - larguraPopover - 8
    }

    // Abre embaixo do botão; se não couber, abre em cima
    const espacoAbaixo = window.innerHeight - rect.bottom
    const abrirAcima = espacoAbaixo < alturaPopover && rect.top > alturaPopover

    setPosicao({
      top: abrirAcima ? rect.top - alturaPopover - 8 : rect.bottom + 8,
      left
    })
  }, [])

  useEffect(() => {
    if (!aberto) return

    calcularPosicao()

    const handleResize = () => calcularPosicao()
    const handleScroll = () => calcularPosicao()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [aberto, calcularPosicao])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        botaoRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setAberto(false)
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [aberto])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    if (aberto) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [aberto])

  if (!descricao) return null

  return (
    <>
      <button
        ref={botaoRef}
        onClick={() => setAberto(!aberto)}
        className="w-6 h-6 rounded-full bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center hover:bg-[#FFB800]/30 transition flex-shrink-0 hover:scale-110"
        type="button"
        aria-label="Ver descrição"
        aria-expanded={aberto}
      >
        <Info size={14} />
      </button>

      {mounted && aberto && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-80 bg-white border border-gray-200 rounded-lg shadow-xl"
          style={{ top: posicao.top, left: posicao.left }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-[#FFB800]/10 border-b border-[#FFB800]/20 rounded-t-lg">
            <span className="text-xs font-semibold text-gray-700">
              Descrição do item
            </span>
            <button
              onClick={() => setAberto(false)}
              className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded"
              type="button"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 leading-relaxed">
              {descricao}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
