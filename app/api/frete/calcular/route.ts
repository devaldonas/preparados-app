import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { cepDestino, items } = await request.json()

    // Validações
    if (!cepDestino || cepDestino.length < 8) {
      return NextResponse.json(
        { success: false, error: 'CEP de destino inválido' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum item no carrinho' },
        { status: 400 }
      )
    }

    const cepLimpo = cepDestino.replace(/\D/g, '')
    const cepOrigem = process.env.CEP_ORIGEM || '04711130'

    // =====================================================
    // 1. Buscar peso e dimensões dos produtos no banco
    // =====================================================
    const productIds = items.map((i: any) => i.product_id)

    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, weight, length_cm, width_cm, height_cm, free_shipping')
      .in('id', productIds)

    if (prodError) {
      console.error('Erro ao buscar produtos:', prodError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }

    // Se TODOS os produtos têm frete grátis, retorna grátis
    const todosFreteGratis = items.every((item: any) => {
      const prod = products?.find((p: any) => p.id === item.product_id)
      return prod?.free_shipping === true
    })

    if (todosFreteGratis) {
      return NextResponse.json({
        success: true,
        opcoes: [{
          servico: 'Frete Grátis',
          transportadora: 'Loja',
          preco: 0,
          prazo: 0,
          gratis: true
        }]
      })
    }

    // =====================================================
    // 2. Monta payload pro Melhor Envio
    // =====================================================
    const productsPayload = items.map((item: any) => {
      const prod = products?.find((p: any) => p.id === item.product_id)
      return {
        id: String(item.product_id),
        width: prod?.width_cm || 20,
        height: prod?.height_cm || 10,
        length: prod?.length_cm || 30,
        weight: prod?.weight || 0.5,
        insurance_value: item.price || 0,
        quantity: item.quantity || 1
      }
    })

    const payload = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cepLimpo },
      products: productsPayload,
      options: {
        receipt: false,
        own_hand: false
      }
    }

    // =====================================================
    // 3. Chama a API do Melhor Envio
    // =====================================================
    const meUrl = process.env.MELHOR_ENVIO_URL || 'https://sandbox.melhorenvio.com.br'
    const meToken = process.env.MELHOR_ENVIO_TOKEN

    if (!meToken) {
      console.error('MELHOR_ENVIO_TOKEN não configurado')
      return NextResponse.json(
        { success: false, error: 'Frete não configurado' },
        { status: 500 }
      )
    }

    const response = await fetch(`${meUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${meToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Preparado App (contato@preparado.app)'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erro Melhor Envio:', response.status, errText)
      return NextResponse.json(
        { success: false, error: 'Erro ao calcular frete' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // =====================================================
    // 4. Filtra e normaliza
    // =====================================================
    const opcoes = (data || [])
      .filter((o: any) => !o.error && o.price)
      .map((o: any) => ({
        id: o.id,
        servico: o.name,
        transportadora: o.company?.name || 'Transportadora',
        preco: parseFloat(o.custom_price || o.price),
        prazo: o.custom_delivery_time || o.delivery_time,
        gratis: false
      }))
      .sort((a: any, b: any) => a.preco - b.preco)

    if (opcoes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma opção de frete disponível para este CEP'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      opcoes
    })
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao calcular frete' },
      { status: 500 }
    )
  }
}
