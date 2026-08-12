// app/api/assinatura/criar/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 CORRIGIDO: usando as any
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({
        plan_id: planId,
        subscription_status: 'active',
        subscription_id: `mock_${Date.now()}`,
        payment_method: 'mock',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura criada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}