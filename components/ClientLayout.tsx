'use client'

import { usePathname } from 'next/navigation'
import CarouselFooter from '@/components/CarouselFooter'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Rotas onde NÃO queremos mostrar o carrossel
  const hideCarouselRoutes = [
    '/auth/login', 
    '/auth/cadastro', 
    '/auth/recuperar-senha', 
    '/auth/atualizar-senha',
    '/'  // ← ADICIONE ESTA LINHA para esconder na home
  ]
  const showCarousel = !hideCarouselRoutes.includes(pathname)

  return (
    <>
      {children}
      {showCarousel && <CarouselFooter />}
    </>
  )
}