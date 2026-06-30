// app/api/melhor-envio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    console.log('📦 Webhook Melhor Envio recebido:', { event, data })

    // Mapear eventos para status do pedido
    const statusMap: Record<string, string> = {
      'order.created': 'label_created',
      'order.released': 'label_paid',
      'order.generated': 'label_generated',
      'order.posted': 'posted',
      'order.delivered': 'delivered',
      'order.cancelled': 'cancelled',
      'order.undelivered': 'delivery_failed'
    }

    const newStatus = statusMap[event]
    if (!newStatus) {
      return NextResponse.json({ success: true })
    }

    // Buscar pedido pelo tracking code ou shipment id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('tracking_code', data.tracking)
      .single()

    if (orderError || !order) {
      console.warn('Pedido não encontrado para tracking:', data.tracking)
      return NextResponse.json({ success: true })
    }

    // Atualizar status do pedido
    await supabase
      .from('orders')
      .update({
        shipping_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    // Se entregue, atualizar status final
    if (event === 'order.delivered' && data.delivered_at) {
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: data.delivered_at
        })
        .eq('id', order.id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro no webhook do Melhor Envio:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}