'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const verificarAdmin = async () => {
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

        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    verificarAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-black text-lg">
                Admin
              </Link>
              <div className="flex gap-4">
                <Link 
                  href="/admin" 
                  className={`text-sm ${pathname === '/admin' ? 'text-[#FFB800] font-semibold' : 'text-gray-600 hover:text-[#FFB800]'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/parceiros" 
                  className={`text-sm ${pathname.startsWith('/admin/parceiros') ? 'text-[#FFB800] font-semibold' : 'text-gray-600 hover:text-[#FFB800]'}`}
                >
                  Parceiros
                </Link>
                <Link 
                  href="/admin/pedidos" 
                  className={`text-sm ${pathname.startsWith('/admin/pedidos') ? 'text-[#FFB800] font-semibold' : 'text-gray-600 hover:text-[#FFB800]'}`}
                >
                  Pedidos
                </Link>
                <Link 
                  href="/admin/produtos" 
                  className={`text-sm ${pathname.startsWith('/admin/produtos') ? 'text-[#FFB800] font-semibold' : 'text-gray-600 hover:text-[#FFB800]'}`}
                >
                  Produtos
                </Link>
                <Link 
                  href="/admin/mentoria" 
                  className={`text-sm ${pathname.startsWith('/admin/mentoria') ? 'text-[#FFB800] font-semibold' : 'text-gray-600 hover:text-[#FFB800]'}`}
                >
                  Mentoria
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
