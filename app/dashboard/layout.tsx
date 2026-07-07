'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Carregar o FloatingCartButton apenas no cliente
const FloatingCartButton = dynamic(
  () => import('@/components/FloatingCartButton'),
  { ssr: false }
)

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {children}
      <FloatingCartButton />
    </>
  )
}