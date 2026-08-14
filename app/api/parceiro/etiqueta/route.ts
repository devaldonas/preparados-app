import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do pedido
    const { data: pedido, error } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) throw error

    // Aqui você pode integrar com Correios/Sedex
    // Por enquanto, retorna os dados para gerar etiqueta

    return NextResponse.json({
      success: true,
      data: pedido,
      message: 'Etiqueta gerada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar etiqueta' },
      { status: 500 }
    )
  }
}
