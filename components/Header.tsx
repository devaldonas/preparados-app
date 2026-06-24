 'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="bg-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            🎒 PREPARADOS
          </Link>
          <button
            onClick={handleLogout}
            className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
