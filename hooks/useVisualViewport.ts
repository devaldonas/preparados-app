'use client'

import { useEffect, useState } from 'react'

/**
 * Hook que retorna a altura real da viewport visível e impede
 * que o iOS empurre a página inteira para cima quando o teclado abre.
 */
export function useVisualViewport() {
  const [height, setHeight] = useState<string>('100dvh')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = (window as any).visualViewport

    // Se não houver suporte, apenas usa 100dvh
    if (!vv) {
      setHeight('100dvh')
      return
    }

    const handleResize = () => {
      // 1. Ajusta a altura do container para o espaço visível real
      setHeight(`${vv.height}px`)

      // 2. Força a janela a voltar para o topo (crucial para iOS)
      // Isso impede que o header seja empurrado para trás da barra de status.
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
    }

    // Executa uma vez para configurar a altura inicial
    handleResize()

    // Escuta os eventos do visualViewport
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)

    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  return height
}
