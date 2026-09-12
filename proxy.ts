import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🔥 Rotas públicas (não exigem autenticação)
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/cadastro',
    '/auth/cadastro-parceiro',
    '/auth/recuperar-senha',
    '/auth/reset-password',
    '/auth/callback',
    '/api',
    '/loja',
    '/planos',
    '/termos',
    '/privacidade',
    '/contato',
    '/parceiro/seja-parceiro',
  ]

  // 🔥 Rotas que exigem autenticação, mas NÃO exigem assinatura
  const authenticatedRoutes = [
    '/perfil',
    '/carteira',
    '/loja/pedidos',
    '/loja/carrinho',
    '/loja/checkout',
    '/loja/confirmacao',
  ]

  // 🔥 Rotas que exigem assinatura ativa (NÃO podem ser acessadas por trial)
  const premiumRoutes = [
    '/dashboard',
    '/dashboard-app',
    '/pessoas',
    '/chat',
    '/comunicador',
    '/grupo',
    '/mentoria',
    '/check-in',
    '/checklist',
    '/mochilas',
    '/catastrofes',
    '/primeiros-socorros',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isAuthenticatedRoute = authenticatedRoutes.some(route => pathname.startsWith(route))
  const isPremiumRoute = premiumRoutes.some(route => pathname.startsWith(route))

  // 🔥 Verificar se tem sessão (cookies do Supabase)
  const hasSession = request.cookies.has('sb-access-token') ||
                     request.cookies.has('sb-refresh-token')

  // 🔥 Se não tiver sessão e tentar acessar rota privada
  if (!hasSession && !isPublicRoute && pathname !== '/') {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 🔥 Se já tem sessão e tentar acessar login
  if (hasSession && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 🔥 Para rotas premium, precisamos verificar o status da assinatura
  // Como o middleware roda no Edge, não conseguimos acessar o Supabase diretamente.
  // A verificação será feita no cliente (layout/página) e no header da requisição.
  if (isPremiumRoute && hasSession) {
    // 🔥 Verificar se há um cookie de assinatura ativa (será setado pelo app após o login)
    const hasActiveSubscription = request.cookies.has('sb-subscription-active')
    
    if (!hasActiveSubscription) {
      return NextResponse.redirect(new URL('/planos', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|logo.svg|logo1.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)',
  ],
}
