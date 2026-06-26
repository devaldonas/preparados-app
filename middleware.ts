// middleware.ts (na raiz do projeto)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from './lib/supabaseClient'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de verificação
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
    '/logo1.svg'
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

  // Verificar status da assinatura
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, trial_end_date')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    return NextResponse.redirect(new URL('/auth/welcome', request.url))
  }

  // Se for uma rota do app e a assinatura estiver expirada
  if (profile.subscription_status === 'expired' || profile.subscription_status === 'cancelled') {
    // Verificar se o trial expirou
    if (profile.trial_end_date) {
      const now = new Date()
      const endDate = new Date(profile.trial_end_date)
      
      if (now > endDate) {
        // Atualizar status para expired
        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('id', session.user.id)
        
        return NextResponse.redirect(new URL('/auth/welcome', request.url))
      }
    }
  }

  // Se chegou até aqui, tem acesso
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
  ]
}