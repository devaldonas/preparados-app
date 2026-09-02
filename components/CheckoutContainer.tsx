'use client'

import { useEffect } from 'react'

export function CheckoutContainer() {
  useEffect(() => {
    // 🔥 Quando o usuário for redirecionado para o Mercado Pago
    // O iframe ocupará toda a tela
    const checkForMP = setInterval(() => {
      const iframes = document.querySelectorAll('iframe[src*="mercadopago"]')
      iframes.forEach((iframe) => {
        // @ts-ignore
        iframe.style.width = '100%'
        // @ts-ignore
        iframe.style.height = '100vh'
        // @ts-ignore
        iframe.style.minHeight = '100vh'
        // @ts-ignore
        iframe.style.border = 'none'
        // @ts-ignore
        iframe.style.position = 'fixed'
        // @ts-ignore
        iframe.style.top = '0'
        // @ts-ignore
        iframe.style.left = '0'
        // @ts-ignore
        iframe.style.zIndex = '9999'
      })
    }, 1000)

    return () => clearInterval(checkForMP)
  }, [])

  return null
}
