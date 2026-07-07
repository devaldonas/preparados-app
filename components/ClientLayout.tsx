'use client'

import { usePathname } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CarouselFooter from '@/components/CarouselFooter'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // DESABILITAR CARROSSEL TEMPORARIAMENTE - retornar false sempre
  const showCarousel = false

  // 🔥 Páginas onde NÃO deve aparecer o NavBar
  const hideNavBarPaths = [
    '/auth/login',
    '/auth/cadastro',
    '/auth/recuperar-senha',
    '/auth/nova-senha',
  ]

  // 🔥 Páginas onde o NavBar deve ficar mais simples (sem links extras)
  const simpleNavBarPaths = [
    '/admin',
    '/admin/',
    '/parceiro/dashboard',
  ]

  const shouldHideNavBar = hideNavBarPaths.some(path => pathname?.startsWith(path))
  const isSimpleNavBar = simpleNavBarPaths.some(path => pathname?.startsWith(path))

  return (
    <>
      {/* 🔥 NavBar - visível em todas as páginas, exceto auth */}
      {!shouldHideNavBar && (
        <NavBar 
          hideNavLinks={isSimpleNavBar}
        />
      )}
      
      {/* 🔥 Conteúdo principal */}
      <main className={!shouldHideNavBar ? 'min-h-screen bg-gray-50' : ''}>
        {children}
      </main>
      
      {/* 🔥 Footer (desabilitado) */}
      {showCarousel && <CarouselFooter />}
    </>
  )
}