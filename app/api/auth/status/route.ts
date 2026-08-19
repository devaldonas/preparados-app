import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Não autenticado' 
      })
    }

    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role,
        subscription_status: profile?.subscription_status,
        full_name: profile?.full_name
      }
    })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
