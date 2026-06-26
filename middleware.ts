// middleware.ts (CORRIGIDO)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from './lib/supabaseClient'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/auth/login',
    '/auth/cadastro',
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

  // Verificar se é rota pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession()
  
  // Se não estiver autenticado, redirecionar para login
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Buscar perfil do usuário para verificar se é admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, subscription_status, trial_end_date')
    .eq('id', session.user.id)
    .single()

  // Se não encontrar o perfil, permitir acesso (não bloquear)
  if (error || !profile) {
    return NextResponse.next()
  }

  // ADMIN: acesso total (ignora trial)
  if (profile.role === 'admin') {
    return NextResponse.next()
  }

  // USUÁRIOS COMUNS: verificar trial
  // Se não tiver dados de trial, criar automaticamente
  if (!profile.trial_end_date || !profile.subscription_status) {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    await supabase
      .from('profiles')
      .update({
        trial_start_date: startDate.toISOString(),
        trial_end_date: endDate.toISOString(),
        subscription_status: 'trial'
      })
      .eq('id', session.user.id)
    
    return NextResponse.next()
  }

  // Verificar se o trial expirou
  if (profile.subscription_status === 'expired' || profile.subscription_status === 'cancelled') {
    const now = new Date()
    const endDate = new Date(profile.trial_end_date)
    
    if (now > endDate) {
      // Se expirou, redirecionar para página de welcome/assinatura
      return NextResponse.redirect(new URL('/auth/welcome', request.url))
    }
  }

  // Se chegou até aqui, tem acesso
  return NextResponse.next()
}

// Configurar quais rotas o middleware deve verificar
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