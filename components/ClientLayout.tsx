// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import CarouselFooter from '@/components/CarouselFooter'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // DESABILITAR CARROSSEL TEMPORARIAMENTE - retornar false sempre
  const showCarousel = false

  return (
    <>
      {children}
      {showCarousel && <CarouselFooter />}
    </>
  )
}