// components/NavBar.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import { ShoppingBag, Package, User, LogOut, Menu, X } from 'lucide-react'

interface NavBarProps {
  showBackButton?: boolean
  backButtonPath?: string
  showCart?: boolean
  title?: string
}

export default function NavBar({ 
  showBackButton = false, 
  backButtonPath,
  showCart = true,
  title
}: NavBarProps) {
  const router = useRouter()
  const { getTotalItems } = useCart()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const cartCount = getTotalItems()

  useEffect(() => {
    carregarUsuario()
  }, [])

  const carregarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleGoBack = () => {
    if (backButtonPath) {
      router.push(backButtonPath)
    } else {
      router.back()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Lado esquerdo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={handleGoBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-lg">←</span>
                <span className="text-sm hidden sm:inline">Voltar</span>
              </button>
            ) : (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-gray-100 rounded-lg transition lg:hidden"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>

          {/* Logo - Central */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/logo1.svg" 
              alt="PREPARADO" 
              className="h-7 w-auto"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-display font-bold text-gray-900 text-base hidden sm:block">
              {title || 'PREPARADO'}
            </span>
          </Link>

          {/* Lado direito - Ações */}
          <div className="flex items-center gap-2">
            {/* Botão do Carrinho */}
            {showCart && (
              <Link
                href="/loja/carrinho"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ShoppingBag size={20} className="text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFB800] text-black text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Menu do Usuário - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/loja/pedidos"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Package size={16} />
                <span>Pedidos</span>
              </Link>
              
              {user && (
                <>
                  <Link
                    href="/perfil"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    <User size={16} />
                    <span>Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </>
              )}
            </div>

            {/* Menu Mobile - Botão do usuário */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
            >
              <User size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Menu Mobile - Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-gray-100 space-y-2">
            <Link
              href="/loja/pedidos"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              <Package size={18} />
              Meus Pedidos
            </Link>
            
            <Link
              href="/perfil"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              <User size={18} />
              Meu Perfil
            </Link>

            <Link
              href="/loja/carrinho"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              <ShoppingBag size={18} />
              Carrinho
              {cartCount > 0 && (
                <span className="ml-auto bg-[#FFB800] text-black text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              <span>🏠</span>
              Dashboard
            </Link>

            {user && (
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={18} />
                Sair
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}