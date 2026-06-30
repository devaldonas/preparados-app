// app/api/frete/etiqueta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { melhorEnvio } from '@/lib/melhorenvio/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, serviceId, remetente, destinatario, produtos } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório', success: false },
        { status: 400 }
      )
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'ID do serviço é obrigatório', success: false },
        { status: 400 }
      )
    }

    // Buscar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado', success: false },
        { status: 404 }
      )
    }

    // Preparar produtos
    const products = (produtos || order.items || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      width: p.width || 20,
      height: p.height || 20,
      length: p.length || 20,
      weight: p.weight || 1,
      price: p.price || 0,
      quantity: p.quantity || 1
    }))

    // Dados do remetente
    const from = remetente || {
      zip: '09835559',
      street: 'Rua Exemplo',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Bernardo do Campo',
      state: 'SP'
    }

    // Dados do destinatário
    const to = destinatario || {
      zip: order.shipping_address?.zip || '',
      street: order.shipping_address?.street || '',
      number: order.shipping_address?.number || '',
      complement: order.shipping_address?.complement || '',
      neighborhood: order.shipping_address?.neighborhood || '',
      city: order.shipping_address?.city || '',
      state: order.shipping_address?.state || ''
    }

    // Criar etiqueta
    const shipment = await melhorEnvio.createShipment({
      service_id: parseInt(serviceId),
      from: from,
      to: to,
      products: products,
      insurance_value: order.total_amount || 0,
      receipt: false,
      own_hand: false,
      collect: false,
      reverse: false,
      non_commercial: false
    })

    // Gerar etiqueta (pagar)
    const label = await melhorEnvio.generateShipmentLabel(shipment.id)

    // Atualizar pedido
    await supabase
      .from('orders')
      .update({
        tracking_code: label.tracking,
        shipping_status: 'label_generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      etiqueta: {
        id: label.id,
        codigoRastreio: label.tracking,
        pdf: label.pdf,
        url: label.pdf,
        transportadora: label.services?.carrier?.name || 'Transportadora',
        status: label.status
      },
      message: 'Etiqueta gerada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao gerar etiqueta',
        success: false 
      },
      { status: 500 }
    )
  }
}