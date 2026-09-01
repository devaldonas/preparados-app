'use client'

import { usePathname } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { Footer } from '@/components/Footer'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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

  // 🔥 Páginas onde NÃO deve aparecer o Footer
  const hideFooterPaths = [
    '/auth/login',
    '/auth/cadastro',
    '/auth/recuperar-senha',
    '/auth/nova-senha',
  ]

  const shouldHideNavBar = hideNavBarPaths.some(path => pathname?.startsWith(path))
  const isSimpleNavBar = simpleNavBarPaths.some(path => pathname?.startsWith(path))
  const shouldHideFooter = hideFooterPaths.some(path => pathname?.startsWith(path))

  return (
    <div className="min-h-screen flex flex-col">
      {/* 🔥 NavBar - visível em todas as páginas, exceto auth */}
      {!shouldHideNavBar && (
        <NavBar 
          hideNavLinks={isSimpleNavBar}
        />
      )}
      
      {/* 🔥 Conteúdo principal */}
      <main className={`flex-1 ${!shouldHideNavBar ? 'bg-gray-50' : ''}`}>
        {children}
      </main>
      
      {/* 🔥 Footer - visível em todas as páginas, exceto auth */}
      {!shouldHideFooter && <Footer />}
    </div>
  )
}
