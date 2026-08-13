'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/admin/login')
          return
        }

        // 🔥 CORRIGIDO: buscar perfil com as any
        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/dashboard')
      }
    }

    verificarAdmin()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return <>{children}</>
}