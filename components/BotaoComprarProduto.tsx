'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ShoppingCart, X } from 'lucide-react'

interface Produto {
  id: number
  name: string
  price: number
  image_url?: string
}

interface BotaoComprarProdutoProps {
  produtos: Produto[]
}

export default function BotaoComprarProduto({ produtos }: BotaoComprarProdutoProps) {
  const [aberto, setAberto] = useState(false)
  const [posicao, setPosicao] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Só renderiza o portal no cliente (evita erro de SSR)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcula a posição do popover quando abre
  const calcularPosicao = useCallback(() => {
    if (!botaoRef.current) return
    const rect = botaoRef.current.getBoundingClientRect()
    const larguraPopover = 288 // w-72 = 18rem = 288px

    // Tenta alinhar à direita do botão; se não couber, alinha à esquerda
    let left = rect.right - larguraPopover
    if (left < 8) {
      left = rect.left
    }
    if (left + larguraPopover > window.innerWidth - 8) {
      left = window.innerWidth - larguraPopover - 8
    }

    // Abre embaixo do botão; se não couber, abre em cima
    const alturaPopover = 280 // estimativa
    const espacoAbaixo = window.innerHeight - rect.bottom
    const abrirAcima = espacoAbaixo < alturaPopover && rect.top > alturaPopover

    setPosicao({
      top: abrirAcima ? rect.top - alturaPopover - 8 : rect.bottom + 8,
      left
    })
  }, [])

  // Recalcula ao abrir, redimensionar ou rolar
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

  // Fecha ao clicar fora
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

  // Fecha com ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    if (aberto) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [aberto])

  if (!produtos || produtos.length === 0) return null

  // Caso 1: só um produto → link direto
  if (produtos.length === 1) {
    const p = produtos[0]
    return (
      <Link
        href={`/loja/produto/${p.id}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFB800] text-black text-xs font-semibold hover:bg-[#E5A600] transition flex-shrink-0"
        title={`Comprar: ${p.name}`}
      >
        <ShoppingCart size={12} />
        Comprar
      </Link>
    )
  }

  // Caso 2: múltiplos produtos → popover via portal
  return (
    <>
      <button
        ref={botaoRef}
        onClick={() => setAberto(!aberto)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFB800] text-black text-xs font-semibold hover:bg-[#E5A600] transition flex-shrink-0"
        title={`${produtos.length} opções disponíveis`}
        type="button"
        aria-expanded={aberto}
        aria-haspopup="true"
      >
        <ShoppingCart size={12} />
        Comprar ({produtos.length})
      </button>

      {mounted && aberto && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-72 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          style={{ top: posicao.top, left: posicao.left }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-700">
              Escolha uma opção
            </span>
            <button
              onClick={() => setAberto(false)}
              className="text-gray-400 hover:text-gray-600 transition"
              type="button"
              aria-label="Fechar"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {produtos.map((p) => (
              <Link
                key={p.id}
                href={`/loja/produto/${p.id}`}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FFB800]/10 transition border-b border-gray-50 last:border-0"
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-10 h-10 object-contain rounded bg-gray-50 flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-[#FFB800] font-bold">
                    R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
