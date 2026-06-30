// app/api/teste-parceiros/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // 🔥 QUERY MAIS SIMPLES POSSÍVEL
    const { data, error } = await supabase
      .from('partners')
      .select('*')

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        success: false 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      total: data?.length || 0,
      partners: data || []
    })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      success: false 
    }, { status: 500 })
  }
}