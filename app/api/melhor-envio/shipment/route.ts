// app/api/melhor-envio/shipment/route.ts (CORRIGIDO)
import { NextRequest, NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'
import { supabase } from '@/lib/supabaseClient'

// Definir a interface para o endereço
interface ShippingAddress {
  zip?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  name?: string
  phone?: string
  email?: string
}

interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  width?: number
  height?: number
  length?: number
  weight?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, serviceId, remetente, destinatario, produtos, volumes } = body

    // Validar dados obrigatórios
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório', success: false },
        { status: 400 }
      )
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'ID do serviço de envio é obrigatório', success: false },
        { status: 400 }
      )
    }

    // Buscar pedido no banco
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          cep
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado', success: false },
        { status: 404 }
      )
    }

    // Preparar dados do remetente (loja)
    const from = remetente || {
      zip: '09835559',
      street: 'Rua Exemplo',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Bernardo do Campo',
      state: 'SP',
      name: 'PREPARADO Loja',
      phone: '(11) 99999-9999',
      email: 'loja@preparado.com'
    }

    // Preparar dados do destinatário (cliente)
    let shippingAddress: ShippingAddress = {}
    try {
      const parsed = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address || {}
      shippingAddress = parsed as ShippingAddress
    } catch {
      shippingAddress = {}
    }

    // CORRIGIDO: Usar ShippingAddress com propriedades opcionais
    const to = destinatario || {
      zip: shippingAddress.zip || order.profiles?.cep || '',
      street: shippingAddress.street || '',
      number: shippingAddress.number || '',
      complement: shippingAddress.complement || '',
      neighborhood: shippingAddress.neighborhood || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      name: order.profiles?.full_name || shippingAddress.name || 'Cliente',
      phone: shippingAddress.phone || '',
      email: order.profiles?.email || ''
    }

    // Preparar produtos
    const orderItems: OrderItem[] = order.items || []
    const products = produtos || orderItems.map((item: OrderItem) => ({
      id: item.product_id || 'produto-temp',
      name: item.name || 'Produto',
      width: item.width || 20,
      height: item.height || 20,
      length: item.length || 20,
      weight: item.weight || 1,
      price: item.price || 0,
      quantity: item.quantity || 1
    }))

    // Calcular valor total do seguro
    const insuranceValue = products.reduce((sum: number, p: any) => {
      return sum + (p.price || 0) * (p.quantity || 1)
    }, 0)

    // Criar etiqueta no Melhor Envio
    const shipment = await melhorEnvio.createShipment({
      service_id: parseInt(serviceId),
      from: from,
      to: to,
      products: products,
      insurance_value: insuranceValue,
      receipt: false,
      own_hand: false,
      collect: false,
      reverse: false,
      non_commercial: false
    })

    // Gerar etiqueta (pagar)
    const label = await melhorEnvio.generateShipmentLabel(shipment.id)

    // Atualizar pedido no banco com dados da etiqueta
    await supabase
      .from('orders')
      .update({
        tracking_code: label.tracking,
        shipping_status: 'label_generated',
        shipping_service: label.services?.name || 'Transportadora',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    // Registrar na tabela de envios (se existir)
    try {
      await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          shipment_id: label.id,
          tracking_code: label.tracking,
          service: label.services?.name || '',
          carrier: label.services?.carrier?.name || '',
          status: label.status || 'created',
          pdf_url: label.pdf,
          created_at: new Date().toISOString()
        })
    } catch {
      // Tabela shipments pode não existir ainda
    }

    return NextResponse.json({
      success: true,
      data: {
        shipmentId: label.id,
        trackingCode: label.tracking,
        pdfUrl: label.pdf,
        status: label.status,
        carrier: label.services?.carrier?.name || 'Transportadora',
        service: label.services?.name || 'Serviço'
      },
      message: 'Etiqueta gerada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao criar etiqueta:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao criar etiqueta',
        success: false 
      },
      { status: 500 }
    )
  }
}

// GET - Buscar etiqueta de um pedido
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const shipmentId = searchParams.get('shipmentId')
    const trackingCode = searchParams.get('tracking')

    // Buscar por ID do pedido
    if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('tracking_code, shipping_status, shipping_service')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado', success: false },
          { status: 404 }
        )
      }

      if (!order.tracking_code) {
        return NextResponse.json({
          success: true,
          hasTracking: false,
          message: 'Pedido ainda não possui código de rastreio'
        })
      }

      // Buscar rastreio atualizado
      try {
        const tracking = await melhorEnvio.getTrackingByCode(order.tracking_code)
        return NextResponse.json({
          success: true,
          hasTracking: true,
          tracking: {
            codigo: tracking.tracking,
            status: tracking.status,
            eventos: tracking.events?.map((event: any) => ({
              status: event.status,
              descricao: event.description,
              data: event.datetime,
              local: event.location
            })) || []
          },
          shipping: {
            service: order.shipping_service,
            status: order.shipping_status
          }
        })
      } catch (trackingError) {
        return NextResponse.json({
          success: true,
          hasTracking: true,
          tracking: {
            codigo: order.tracking_code,
            status: 'pendente',
            eventos: []
          },
          shipping: {
            service: order.shipping_service,
            status: order.shipping_status
          },
          error: 'Não foi possível obter informações de rastreio'
        })
      }
    }

    // Buscar por ID da etiqueta
    if (shipmentId) {
      const shipment = await melhorEnvio.getShipment(parseInt(shipmentId))
      return NextResponse.json({
        success: true,
        shipment: shipment
      })
    }

    // Buscar por código de rastreio
    if (trackingCode) {
      const tracking = await melhorEnvio.getTrackingByCode(trackingCode)
      return NextResponse.json({
        success: true,
        tracking: {
          codigo: tracking.tracking,
          status: tracking.status,
          eventos: tracking.events?.map((event: any) => ({
            status: event.status,
            descricao: event.description,
            data: event.datetime,
            local: event.location
          })) || []
        }
      })
    }

    // Se não tiver parâmetros, listar etiquetas recentes
    const shipments = await melhorEnvio.listShipments(1, 20)
    return NextResponse.json({
      success: true,
      shipments: shipments
    })

  } catch (error) {
    console.error('Erro ao buscar etiqueta:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao buscar etiqueta',
        success: false 
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar etiqueta
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'ID da etiqueta é obrigatório', success: false },
        { status: 400 }
      )
    }

    const result = await melhorEnvio.cancelShipment(parseInt(shipmentId))

    return NextResponse.json({
      success: true,
      message: 'Etiqueta cancelada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao cancelar etiqueta:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao cancelar etiqueta',
        success: false 
      },
      { status: 500 }
    )
  }
}