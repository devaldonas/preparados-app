import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/cadastro',
  '/auth/cadastro-parceiro',
  '/auth/recuperar-senha',
  '/auth/reset-password',
  '/auth/callback',
  '/api/disasters',
  '/api/noaa',
  '/api/mercadopago/webhook',
  '/api/mercadopago/status',
  '/api/assinatura/criar',
  '/loja',
  '/loja/produto',
  '/planos',
  '/planos/pagamento',
  '/auth/welcome',
]

// Rotas que exigem pagamento
const protectedRoutes = [
  '/dashboard',
  '/parceiro',
  '/admin',
  '/mentoria',
  '/loja/pedidos',
  '/loja/carrinho',
  '/loja/checkout',
  '/mochilas',
  '/pessoas',
  '/check-in',
  '/catastrofes',
  '/primeiros-socorros',
  '/perfil',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar se há sessão
  const hasSession = request.cookies.has('sb-access-token') || 
                     request.cookies.has('sb-refresh-token') ||
                     request.cookies.has('supabase-auth-token')

  // Se não tiver sessão e tentar acessar rota protegida
  if (!hasSession && isProtectedRoute) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Se já tem sessão e tentar acessar login/cadastro
  if (hasSession && (pathname === '/auth/login' || pathname === '/auth/cadastro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 🔥 SE FOR ROTA PROTEGIDA, VERIFICAR STATUS DE PAGAMENTO
  if (hasSession && isProtectedRoute) {
    try {
      // Importar dinamicamente para evitar problemas
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('subscription_status, role')
          .eq('id', user.id)
          .single()

        // Admin tem acesso sempre
        if (profile?.role === 'admin') {
          return NextResponse.next()
        }

        // Verificar se tem acesso pago
        const hasAccess = profile?.subscription_status === 'active' || 
                         profile?.subscription_status === 'paid' ||
                         profile?.subscription_status === 'approved'

        if (!hasAccess) {
          console.log('🚫 Usuário sem acesso:', user.email, 'Status:', profile?.subscription_status)
          const url = new URL('/planos', request.url)
          return NextResponse.redirect(url)
        }

        console.log('✅ Usuário com acesso:', user.email)
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error)
      // Em caso de erro, permitir acesso (fallback)
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|logo.svg|logo1.svg).*)',
  ],
}
