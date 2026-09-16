'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import { 
  ShoppingBag, 
  Package, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Store, 
  ChevronDown,
  Crown,
  Shield,
  Wallet,
  Gift
} from 'lucide-react'

interface NavBarProps {
  showBackButton?: boolean
  backButtonPath?: string
  showCart?: boolean
  title?: string
  hideNavLinks?: boolean
  /** 🔥 Sino de notificações — renderizado fora do NavBar para não remontar */
  sino?: React.ReactNode
}

export default function NavBar({ 
  showBackButton = false, 
  backButtonPath,
  showCart = true,
  title,
  hideNavLinks = false,
  sino
}: NavBarProps) {
  const router = useRouter()
  
  // 🔥 Selector reativo do Zustand
  const cartCount = useCart(state => 
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profile)
      }
    }
    
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isTrial = userProfile?.subscription_status === 'trial'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo + Voltar */}
          <div className="flex items-center gap-3">
            {showBackButton && backButtonPath && (
              <Link
                href={backButtonPath}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ←
              </Link>
            )}
            
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/logo2.svg" 
                alt="PREPARADO" 
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-gray-900 hidden sm:block">
                PREPARADO
              </span>
            </Link>

            {title && (
              <span className="text-sm text-gray-500 hidden md:block">
                {title}
              </span>
            )}
          </div>

          {/* Links (desktop) */}
          {!hideNavLinks && (
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Início
              </Link>
              <Link
                href="/mochilas"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Mochilas
              </Link>
              <Link
                href="/loja"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Loja
              </Link>
              <Link
                href="/pessoas"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Pessoas
              </Link>
              <Link
                href="/comunicador"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Comunicador
              </Link>
            </div>
          )}

          {/* Ações (direita) */}
          <div className="flex items-center gap-2">
            
            {/* 🔥 SINO — vem de fora via prop */}
            {!isTrial && sino && (
              <div className="flex items-center gap-2">
                {sino}
              </div>
            )}

            {/* Carrinho */}
            {showCart && (
              <Link
                href="/loja/carrinho"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ShoppingBag size={20} className="text-gray-700" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFB800] text-black text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Menu do usuário */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center">
                    <User size={16} className="text-black" />
                  </div>
                  <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/perfil"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <User size={16} />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/carteira"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Wallet size={16} />
                        Carteira
                      </Link>
                      <Link
                        href="/planos"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Crown size={16} />
                        Assinatura
                      </Link>
                      {userProfile?.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <LayoutDashboard size={16} />
                          Painel Admin
                        </Link>
                      )}
                      {(userProfile?.role === 'partner' || userProfile?.role === 'admin') && (
                        <Link
                          href="/parceiro/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Store size={16} />
                          Painel Parceiro
                        </Link>
                      )}
                      <Link
                        href="/loja/pedidos"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Package size={16} />
                        Meus Pedidos
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
