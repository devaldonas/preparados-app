// middleware.ts (ATUALIZADO)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from './lib/supabaseClient'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas
  const publicRoutes = [
    '/auth/login',
    '/auth/cadastro',
    '/auth/cadastro-parceiro',
    '/auth/recuperar-senha',
    '/auth/atualizar-senha',
    '/auth/welcome',
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/logo1.svg',
    '/'
  ]

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Buscar role do usuário
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const role = profile.role || 'user'

  // 🔥 REGRAS DE ACESSO

  // Admin: acesso total
  if (role === 'admin') {
    return NextResponse.next()
  }

  // Parceiro: acesso APENAS a rotas de parceiro
  if (role === 'partner') {
    // Se tentar acessar rotas de usuário comum, redirecionar para parceiro
    const userRoutes = ['/dashboard', '/checklist', '/mochilas', '/pessoas', '/catastrofes', '/comunicador', '/grupo', '/loja', '/check-in']
    if (userRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/parceiro/dashboard', request.url))
    }
    // Permitir acesso a rotas de parceiro
    if (pathname.startsWith('/parceiro')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/parceiro/dashboard', request.url))
  }

  // Usuário comum: acesso APENAS a rotas de usuário
  if (role === 'user' || !role) {
    // Se tentar acessar rotas de parceiro, redirecionar para dashboard
    if (pathname.startsWith('/parceiro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Se tentar acessar admin, redirecionar para dashboard
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/loja/:path*',
    '/checklist/:path*',
    '/mochilas/:path*',
    '/catastrofes/:path*',
    '/pessoas/:path*',
    '/comunicador/:path*',
    '/grupo/:path*',
    '/admin/:path*',
    '/parceiro/:path*',
    '/check-in/:path*',
    '/perfil/:path*',
  ]
}