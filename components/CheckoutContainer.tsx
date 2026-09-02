'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function CheckoutContainer() {
  const pathname = usePathname()

  useEffect(() => {
    // 🔥 Função para aplicar estilos ao iframe
    const aplicarEstilosCheckout = () => {
      const iframes = document.querySelectorAll('iframe[src*="mercadopago"], iframe[src*="checkout"]')
      
      if (iframes.length === 0) {
        // 🔥 Se não houver iframe, remover estilos
        document.body.classList.remove('checkout-open')
        document.body.style.margin = ''
        document.body.style.padding = ''
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.height = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.documentElement.style.overflow = ''
        document.documentElement.style.position = ''
        document.documentElement.style.width = ''
        document.documentElement.style.height = ''
        return
      }

      iframes.forEach((iframe) => {
        // @ts-ignore
        iframe.style.width = '100vw'
        // @ts-ignore
        iframe.style.height = '100vh'
        // @ts-ignore
        iframe.style.minHeight = '100vh'
        // @ts-ignore
        iframe.style.maxHeight = '100vh'
        // @ts-ignore
        iframe.style.border = 'none'
        // @ts-ignore
        iframe.style.position = 'fixed'
        // @ts-ignore
        iframe.style.top = '0'
        // @ts-ignore
        iframe.style.left = '0'
        // @ts-ignore
        iframe.style.zIndex = '99999'
        // @ts-ignore
        iframe.style.overflow = 'hidden'
        // @ts-ignore
        iframe.style.display = 'block'
        // @ts-ignore
        iframe.style.visibility = 'visible'
        // @ts-ignore
        iframe.style.opacity = '1'
        // @ts-ignore
        iframe.style.backgroundColor = '#ffffff'
        // @ts-ignore
        iframe.style.boxSizing = 'border-box'
        // @ts-ignore
        iframe.style.margin = '0'
        // @ts-ignore
        iframe.style.padding = '0'
      })

      // 🔥 Aplicar à página também
      document.body.style.margin = '0'
      document.body.style.padding = '0'
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100vw'
      document.body.style.height = '100vh'
      document.body.style.top = '0'
      document.body.style.left = '0'
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.position = 'fixed'
      document.documentElement.style.width = '100vw'
      document.documentElement.style.height = '100vh'
      document.body.classList.add('checkout-open')
    }

    // 🔥 Verificar periodicamente se o iframe foi carregado
    const checkInterval = setInterval(() => {
      const hasIframe = document.querySelector('iframe[src*="mercadopago"], iframe[src*="checkout"]')
      if (hasIframe) {
        aplicarEstilosCheckout()
      } else {
        // 🔥 Remover estilos se não houver iframe
        document.body.classList.remove('checkout-open')
        document.body.style.margin = ''
        document.body.style.padding = ''
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.height = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.documentElement.style.overflow = ''
        document.documentElement.style.position = ''
        document.documentElement.style.width = ''
        document.documentElement.style.height = ''
      }
    }, 500)

    // 🔥 Observer para detectar quando o iframe é adicionado/removido
    const observer = new MutationObserver(() => {
      const hasIframe = document.querySelector('iframe[src*="mercadopago"], iframe[src*="checkout"]')
      if (hasIframe) {
        aplicarEstilosCheckout()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    })

    // 🔥 Também observar mudanças no window (para redimensionamento)
    const handleResize = () => {
      const hasIframe = document.querySelector('iframe[src*="mercadopago"], iframe[src*="checkout"]')
      if (hasIframe) {
        aplicarEstilosCheckout()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(checkInterval)
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      document.body.classList.remove('checkout-open')
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.position = ''
      document.documentElement.style.width = ''
      document.documentElement.style.height = ''
    }
  }, [pathname])

  return null
}
