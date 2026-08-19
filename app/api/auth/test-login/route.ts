import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔍 Testando login para:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Erro:', error.message)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 401 })
    }
    
    console.log('✅ Login bem-sucedido!')
    
    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session ? 'created' : 'none'
    })
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
