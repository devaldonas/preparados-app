'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // 🔥 VERIFICAR SE É PARCEIRO
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        console.log('🔍 Dashboard - Perfil:', profile)

        // 🔥 SE FOR PARCEIRO, REDIRECIONAR PARA /PARCEIRO/DASHBOARD
        if (profile?.role === 'partner') {
          console.log('✅ Parceiro detectado - redirecionando para /parceiro/dashboard')
          window.location.href = '/parceiro/dashboard'
          return
        }

        // 🔥 VERIFICAR TABELA partners
        const { data: partner } = await supabase
          .from('partners')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('🔍 Dashboard - Partner:', partner)

        if (partner?.status === 'approved') {
          console.log('✅ Parceiro aprovado - redirecionando para /parceiro/dashboard')
          window.location.href = '/parceiro/dashboard'
          return
        }

        // 🔥 SE FOR ADMIN
        if (profile?.role === 'admin') {
          window.location.href = '/admin'
          return
        }

        // 🔥 USUÁRIO COMUM - VERIFICAR ASSINATURA
        const { data: profileComplete } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        const hasAccess = profileComplete?.subscription_status === 'active' || 
                         profileComplete?.subscription_status === 'paid' ||
                         profileComplete?.subscription_status === 'approved'

        if (!hasAccess) {
          window.location.href = '/planos'
          return
        }

        // 🔥 USUÁRIO COMUM COM ASSINATURA - VAI PARA O DASHBOARD APP
        window.location.href = '/dashboard-app'

      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
        window.location.href = '/auth/login'
      }
    }

    verificarAcesso()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
    </div>
  )
}
