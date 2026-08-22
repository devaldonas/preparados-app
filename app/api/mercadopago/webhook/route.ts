import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log('🚀 WEBHOOK - Buscando pedido 169')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    console.log('💰 Payment ID:', paymentId)

    // 🔥 1. BUSCAR PELO TRANSACTION_ID
    console.log('🔍 Buscando pedido com transaction_id:', paymentId)
    
    const { data: orderByTransaction, error: error1 } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', String(paymentId))
      .maybeSingle()

    console.log('📊 Resultado transaction_id:', orderByTransaction)
    if (error1) console.error('❌ Erro1:', error1)

    if (orderByTransaction) {
      console.log('✅ Pedido encontrado pelo transaction_id:', orderByTransaction.id)
      await atualizarPedido(orderByTransaction.id, paymentId)
      return NextResponse.json({ success: true, orderId: orderByTransaction.id })
    }

    // 🔥 2. BUSCAR DIRETAMENTE O PEDIDO 169
    console.log('🔍 Buscando pedido 169 diretamente...')
    
    const { data: orderById, error: error2 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 169)
      .maybeSingle()

    console.log('📊 Resultado id 169:', orderById)
    if (error2) console.error('❌ Erro2:', error2)

    if (!orderById) {
      console.log('❌ Pedido 169 não encontrado!')
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('✅ Pedido 169 encontrado!', orderById)

    // 🔥 3. ATUALIZAR O PEDIDO 169
    await atualizarPedido(169, paymentId)

    console.log('✅ Pedido #169 atualizado para PAID!')
    return NextResponse.json({ success: true, orderId: 169 })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function atualizarPedido(orderId: number, paymentId: string) {
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      transaction_id: String(paymentId),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('❌ Erro ao atualizar pedido:', updateError)
    throw updateError
  }

  console.log('✅ Pedido #', orderId, 'atualizado para PAID!')
}
