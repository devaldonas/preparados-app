'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/lib/store/cart'
import Notificacoes from './Notificacoes';
import { 
  ShoppingBag, 
  Package, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Store, 
  ChevronDown,
  Crown,
  Shield
} from 'lucide-react'

interface NavBarProps {
  showBackButton?: boolean
  backButtonPath?: string
  showCart?: boolean
  title?: string
  hideNavLinks?: boolean
}

export default function NavBar({ 
  showBackButton = false, 
  backButtonPath,
  showCart = true,
  title,
  hideNavLinks = false
}: NavBarProps) {
  const router = useRouter()
  const { getTotalItems } = useCart()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const cartCount = getTotalItems()

  useEffect(() => {
    carregarUsuario()
  }, [])

  const carregarUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role, full_name, subscription_status')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profile) {
          setUserProfile(profile)
          console.log('👤 Perfil carregado:', profile)
          console.log('🔑 Role:', profile.role)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    }
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

  // 🔥 LINKS DA NAVBAR (sem Admin)
  const getNavLinks = () => {
    const links = [
      { href: '/loja', label: 'Loja', icon: Store }
    ]

    // Admin NÃO aparece aqui - só no menu suspenso
    if (userProfile?.role === 'partner') {
      links.push({ href: '/parceiro/dashboard', label: 'Dashboard', icon: LayoutDashboard })
    } else if (user) {
      links.push({ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard })
    }

    return links
  }

  const navLinks = getNavLinks()

  const isTrial = userProfile?.subscription_status === 'trial'
  const isAdmin = userProfile?.role === 'admin'

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Lado esquerdo com a LOGO */}
          <div className="flex items-center gap-3 flex-1">
            {showBackButton ? (
              <button
                onClick={handleGoBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-lg">←</span>
                <span className="text-sm hidden sm:inline">Voltar</span>
              </button>
            ) : (
              <div className="lg:hidden w-8" />
            )}
            
            {/* LOGO */}
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
              <img 
                src="/logo.svg" 
                alt="PREPARADO" 
                className="h-10 w-auto"
              />
              <span className="font-display font-bold text-gray-900 text-base hidden sm:block">
                {title || ''}
              </span>
            </Link>
          </div>

          {/* Lado direito - Ações */}
          <div className="flex items-center gap-2">
            {/* Links de navegação - Desktop (sem Admin) */}
            {!hideNavLinks && user && (
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    <link.icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Notificacoes />
            </div>
            
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

            {/* Ícone do Usuário */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800] font-bold text-sm">
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* MENU DROPDOWN */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              {/* Cabeçalho do usuário */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {userProfile?.role === 'admin' ? 'Administrador' : 
                     userProfile?.role === 'partner' ? 'Parceiro' : 'Usuário'}
                  </span>
                  {isAdmin && (
                    <span className="inline-block text-xs bg-[#FFB800] text-black px-2 py-0.5 rounded-full font-bold">
                      ⭐ Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Links de navegação - Mobile */}
              {!hideNavLinks && user && (
                <div className="lg:hidden">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <link.icon size={18} />
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                </div>
              )}

              {/* 🔥 LINK ADMIN - APENAS NO MENU SUSPENSO */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#FFB800] hover:bg-yellow-50 transition font-medium"
                  >
                    <Shield size={18} />
                    Painel Admin
                    <span className="ml-auto text-[0.5rem] bg-[#FFB800] text-black px-1.5 py-0.5 rounded-full font-bold">
                      BETA
                    </span>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}

              {/* Link Assinar Premium - apenas para trial */}
              {isTrial && (
                <>
                  <Link
                    href="/planos"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#FFB800] hover:bg-yellow-50 transition font-medium"
                  >
                    <Crown size={18} />
                    Assinar Premium
                    <span className="ml-auto text-xs bg-[#FFB800] text-black px-2 py-0.5 rounded-full font-bold">
                      Oferta
                    </span>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}

              <Link
                href="/loja/pedidos"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <Package size={18} />
                Meus Pedidos
              </Link>
              
              <Link
                href="/perfil"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <User size={18} />
                Meu Perfil
              </Link>

              <Link
                href="/loja/carrinho"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <ShoppingBag size={18} />
                Carrinho
                {cartCount > 0 && (
                  <span className="ml-auto bg-[#FFB800] text-black text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}