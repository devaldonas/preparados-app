// app/api/teste-simples/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // 🔥 LOG DA CONEXÃO
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Presente' : '❌ Ausente')

    // 🔥 A QUERY
    const result = await supabase
      .from('partners')
      .select('*')

    console.log('📦 Resultado da query:', result)

    return NextResponse.json({
      data: result.data,
      error: result.error,
      count: result.data?.length || 0,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    })
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 })
  }
}