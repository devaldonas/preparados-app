 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Início', href: '/dashboard', icon: '🏠' },
    { name: 'Check-in', href: '/check-in', icon: '🧠' },
    { name: 'Mochila', href: '/checklist', icon: '🎒' },
    { name: 'Pessoas', href: '/pessoas', icon: '🗺️' },
    { name: 'Loja', href: '/loja', icon: '📦' },
    { name: 'Catástrofes', href: '/catastrofes', icon: '🌊' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition ${
                  isActive
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-500 hover:text-green-600'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
