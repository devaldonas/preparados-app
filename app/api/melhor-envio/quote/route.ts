// app/api/melhor-envio/quote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

// Definir tipos para a resposta
interface QuoteResponse {
  id: number
  name: string
  price: number
  delivery_time: number
  delivery_time_string?: string
  carrier?: {
    id: number
    name: string
    picture: string
  }
  company?: {
    name: string
    picture: string
  }
  discount?: number
  custom_price?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cepOrigem, cepDestino, produtos, servicos } = body

    // Validar dados obrigatórios
    if (!cepDestino) {
      return NextResponse.json(
        { error: 'CEP de destino é obrigatório', success: false },
        { status: 400 }
      )
    }

    if (!produtos || produtos.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um produto é necessário', success: false },
        { status: 400 }
      )
    }

    // Validar CEPs
    const cepOrigemLimpo = cepOrigem?.replace(/\D/g, '') || '09835559'
    const cepDestinoLimpo = cepDestino.replace(/\D/g, '')

    if (cepDestinoLimpo.length !== 8) {
      return NextResponse.json(
        { error: 'CEP de destino inválido', success: false },
        { status: 400 }
      )
    }

    // Preparar produtos
    const products = produtos.map((p: any) => ({
      id: p.id || 'produto-temp',
      name: p.name || 'Produto',
      width: p.width || 20,
      height: p.height || 20,
      length: p.length || 20,
      weight: p.weight || 1,
      price: p.price || 0,
      quantity: p.quantity || 1
    }))

    // Buscar cotações
    const quotes = await melhorEnvio.getShippingQuote({
      from: {
        zip: cepOrigemLimpo,
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      },
      to: {
        zip: cepDestinoLimpo,
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      },
      products: products,
      services: servicos
    })

    // Verificar se retornou cotações
    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        success: true,
        quotes: [],
        message: 'Nenhuma cotação disponível para este CEP'
      })
    }

    // Formatar resposta - CORRIGIDO usando os campos corretos
    const formattedQuotes = quotes.map((q: any) => ({
      id: q.id,
      name: q.name || 'Serviço',
      price: q.price || 0,
      delivery_time: q.delivery_time || 0,
      delivery_time_string: q.delivery_time_string || `${q.delivery_time || 0} dias`,
      company: {
        name: q.carrier?.name || q.company?.name || 'Transportadora',
        picture: q.carrier?.picture || q.company?.picture || ''
      },
      discount: q.discount || 0,
      custom_price: q.custom_price || q.price || 0
    }))

    // Filtrar apenas cotações com preço válido
    const availableQuotes = formattedQuotes.filter((q: any) => q.price > 0)

    return NextResponse.json({
      success: true,
      quotes: availableQuotes,
      total: availableQuotes.length,
      message: availableQuotes.length > 0 
        ? `${availableQuotes.length} opções de frete disponíveis` 
        : 'Nenhuma opção de frete disponível'
    })

  } catch (error) {
    console.error('Erro ao cotar frete:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao cotar frete',
        success: false 
      },
      { status: 500 }
    )
  }
}