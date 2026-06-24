// app/dashboard/layout.tsx
'use client'

import { ReactNode } from 'react'
import ClientLayout from '@/components/ClientLayout'
import FloatingCartButton from '@/components/FloatingCartButton'

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