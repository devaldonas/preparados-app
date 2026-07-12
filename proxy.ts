import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from './lib/supabaseClient'

// 🔥 RENOMEAR A FUNÇÃO PARA "proxy"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas
  const publicRoutes = [
    '/auth/login',
    '/auth/cadastro',
    '/auth/cadastro-parceiro',
    '/auth/recuperar-senha',
    '/auth/atualizar-senha',
    '/auth/welcome',
    '/planos',
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
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Buscar role do usuário
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, subscription_status, trial_end_date, subscription_end_date')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const role = profile.role || 'user'

  // Verificar status da assinatura (apenas para não-admin)
  if (role !== 'admin') {
    const now = new Date()
    const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null
    const subscriptionEnd = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null

    const isTrialActive = trialEnd && now < trialEnd
    const isSubscriptionActive = profile.subscription_status === 'active' && subscriptionEnd && now < subscriptionEnd

    // Se não estiver em trial e não tiver assinatura ativa
    if (!isTrialActive && !isSubscriptionActive) {
      const allowedWithoutSubscription = ['/planos', '/auth', '/api', '/perfil']
      if (!allowedWithoutSubscription.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/planos', request.url))
      }
    }
  }

  // Regras de acesso por role
  if (role === 'admin') {
    return NextResponse.next()
  }

  if (role === 'partner') {
    const userRoutes = ['/dashboard', '/checklist', '/mochilas', '/pessoas', '/catastrofes', '/comunicador', '/grupo', '/loja', '/check-in']
    if (userRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/parceiro/dashboard', request.url))
    }
    if (pathname.startsWith('/parceiro')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/parceiro/dashboard', request.url))
  }

  if (role === 'user' || !role) {
    if (pathname.startsWith('/parceiro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
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
    '/planos/:path*',
  ]
}