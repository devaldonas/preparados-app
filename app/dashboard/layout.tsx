// app/dashboard/layout.tsx
'use client'

import { ReactNode } from 'react'
import ClientLayout from '@/components/ClientLayout'
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
    <ClientLayout>
      {children}
      <FloatingCartButton />
    </ClientLayout>
  )
}