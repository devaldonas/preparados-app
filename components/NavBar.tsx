'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavBarProps {
  showBackButton?: boolean
  backButtonPath?: string
}

export default function NavBar({ 
  showBackButton = false, 
  backButtonPath
}: NavBarProps) {
  const router = useRouter()

  const handleGoBack = () => {
    if (backButtonPath) {
      router.push(backButtonPath)
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {showBackButton ? (
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
            >
              <span className="text-lg">←</span>
              <span className="text-sm">Voltar</span>
            </button>
          ) : (
            <div></div>
          )}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/logo1.svg" 
              alt="PREPARADO" 
              className="h-6 w-auto"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-semibold text-gray-900 text-sm">PREPARADO</span>
          </Link>
        </div>
      </div>
    </div>
  )
}