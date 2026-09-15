'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { Footer } from '@/components/Footer'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 🔥 Sempre que o app carregar, atualizar o cookie de assinatura
  useEffect(() => {
    const atualizarCookieAssinatura = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await fetch('/api/auth/set-subscription-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
      } catch (error) {
        console.error('Erro ao atualizar cookie de assinatura:', error)
      }
    }

    atualizarCookieAssinatura()
  }, [pathname])

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
    '/chat/',              // chat individual
    '/grupo/',             // ADICIONADO: chat de grupo
  ]

  // 🔥 Páginas onde o layout deve ser FULL SCREEN (sem NavBar, sem Footer)
  // e o container deve ser h-dvh (para o chat ocupar a tela toda)
  const fullScreenPaths = [
    '/chat/',              // chat individual
    '/grupo/',             // ADICIONADO: chat de grupo
  ]

  const shouldHideNavBar = hideNavBarPaths.some(path => pathname?.startsWith(path))
  const isSimpleNavBar = simpleNavBarPaths.some(path => pathname?.startsWith(path))
  const shouldHideFooter = hideFooterPaths.some(path => pathname?.startsWith(path))
  const isFullScreen = fullScreenPaths.some(path => pathname?.startsWith(path))

  // 🔥 Rota de chat: layout full screen, sem NavBar e sem Footer
  if (isFullScreen) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    )
  }

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
      
      {/* 🔥 Footer - visível em todas as páginas, exceto auth e chat */}
      {!shouldHideFooter && <Footer />}
    </div>
  )
}
