import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rotas públicas
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
  ]
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Verificar se tem sessão (Supabase)
  const hasSession = request.cookies.has('sb-access-token') || 
                     request.cookies.has('sb-refresh-token')

  // Se não tiver sessão e tentar acessar rota privada
  if (!hasSession && !isPublicRoute && pathname !== '/') {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Se já tem sessão e tentar acessar login
  if (hasSession && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// 🔥 MATCHER ATUALIZADO (mesmo do middleware)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|logo.svg|logo1.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)',
  ],
}
