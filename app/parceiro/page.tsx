// app/parceiro/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParceiroPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para o dashboard do parceiro
    router.push('/parceiro/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
    </div>
  )
}