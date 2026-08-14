'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ParceiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verificarParceiro = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        // Se não for parceiro, redireciona para dashboard normal
        if (profile?.role !== 'partner') {
          router.push('/dashboard')
          return
        }

        // Se for parceiro, vai para o dashboard do parceiro
        router.push('/parceiro/dashboard')
      } catch (error) {
        console.error('Erro ao verificar parceiro:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    verificarParceiro()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return null
}
