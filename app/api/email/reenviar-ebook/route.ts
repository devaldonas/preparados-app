import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { pedidoId } = await request.json()

    // Buscar pedido
    const { data: pedido, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        items,
        transaction_id
      `)
      .eq('id', pedidoId)
      .single()

    if (error || !pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Buscar produtos digitais
    const produtosDigitaiz = pedido.items.filter((item: any) => item.products?.is_digital)

    if (produtosDigitaiz.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto digital neste pedido' }, { status: 400 })
    }

    // Buscar e-mail do usuário
    const { data: userData } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', pedido.user_id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', pedido.user_id)
      .single()

    // Enviar e-mails
    for (const item of produtosDigitaiz) {
      await enviarEbookPorEmail({
        email: userData?.email || '',
        nome: profile?.full_name || 'Usuário',
        produtoNome: item.products?.name || 'E-book',
        fileUrl: item.products?.file_url || '',
        pedidoId: pedido.id
      })
    }

    return NextResponse.json({
      success: true,
      message: 'E-book reenviado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao reenviar e-book:', error)
    return NextResponse.json({ error: 'Erro ao reenviar e-book' }, { status: 500 })
  }
}