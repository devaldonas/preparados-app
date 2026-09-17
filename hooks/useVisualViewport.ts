'use client'

import { useEffect, useState } from 'react'

/**
 * Hook que retorna a altura real da viewport visível.
 * Detecta quando o teclado virtual sobe no iOS/Android e ajusta a altura.
 *
 * Uso:
 *   const height = useVisualViewport()
 *   <div style={{ height }}>...</div>
 */
export function useVisualViewport() {
  const [height, setHeight] = useState<string>('100dvh')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = (window as any).visualViewport

    if (!vv) {
      // Fallback para navegadores antigos
      setHeight('100dvh')
      return
    }

    const handleResize = () => {
      // Altura visível real (exclui teclado + barra de endereço)
      setHeight(`${vv.height}px`)
    }

    handleResize()
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)

    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  return height
}
