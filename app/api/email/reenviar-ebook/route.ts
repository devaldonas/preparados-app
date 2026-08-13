import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { enviarEbookPorEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { pedidoId } = await request.json()

    // Buscar pedido com as any
    const { data: pedido, error } = await (supabase
      .from('orders') as any)
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

    // Filtrar produtos digitais
    const produtosDigitais = pedido.items?.filter((item: any) => item.products?.is_digital) || []

    if (produtosDigitais.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto digital neste pedido' }, { status: 400 })
    }

    // 🔥 CORRIGIDO: buscar perfil do usuário (já tem o email)
    let userEmail = null
    let userNome = null

    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .select('full_name, email')
      .eq('id', pedido.user_id)
      .single()

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
    } else if (profile) {
      userNome = profile.full_name || 'Usuário'
      userEmail = profile.email || null
    }

    // 🔥 REMOVIDO: RPC get_user_email (não existe)
    // Se não tiver email, usa fallback
    if (!userEmail) {
      console.warn('⚠️ Email não encontrado no perfil, usando fallback')
      userEmail = 'cliente@preparado.com'
    }

    if (!userNome) {
      userNome = 'Cliente'
    }

    console.log('📧 Email final:', userEmail)
    console.log('👤 Nome final:', userNome)

    // Enviar e-books
    for (const item of produtosDigitais) {
      console.log('📚 Enviando e-book:', item.products?.name)
      
      const result = await enviarEbookPorEmail({
        email: userEmail,
        nome: userNome,
        produtoNome: item.products?.name || 'E-book',
        fileUrl: item.products?.file_url || '',
        pedidoId: pedido.id
      })

      console.log('📧 Resultado:', result)
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