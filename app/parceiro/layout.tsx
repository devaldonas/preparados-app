// app/parceiro/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ParceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isPartner, setIsPartner] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const { data: partner } = await supabase
          .from('partners')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile?.role === 'partner' || partner?.status === 'approved') {
          setIsPartner(true)
        } else if (partner?.status === 'pending') {
          router.push('/parceiro/aguardando-aprovacao')
          return
        } else if (partner?.status === 'rejected') {
          router.push('/parceiro/rejeitado')
          return
        } else {
          router.push('/dashboard')
          return
        }

      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    verificarAcesso()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!isPartner) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu do Parceiro */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/parceiro/dashboard" className="font-bold text-black">
                🎒 Parceiro
              </Link>
              <div className="flex gap-4">
                <Link href="/parceiro/dashboard" className="text-sm text-gray-600 hover:text-[#FFB800]">
                  Dashboard
                </Link>
                <Link href="/parceiro/produtos" className="text-sm text-gray-600 hover:text-[#FFB800]">
                  Produtos
                </Link>
                <Link href="/parceiro/pedidos" className="text-sm text-gray-600 hover:text-[#FFB800]">
                  Pedidos
                </Link>
                <Link href="/parceiro/comissoes" className="text-sm text-gray-600 hover:text-[#FFB800]">
                  Comissões
                </Link>
              </div>
            </div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
              Sair
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}