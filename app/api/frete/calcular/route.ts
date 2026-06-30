// app/api/frete/calcular/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

interface ProdutoFrete {
  id?: string
  nome: string
  peso: number
  altura: number
  largura: number
  comprimento: number
  quantidade: number
  valor: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cepDestino, produtos, cepOrigem } = body

    // Validar dados
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

    // Preparar produtos para a API do Melhor Envio
    const products = produtos.map((p: ProdutoFrete) => ({
      id: p.id || 'produto-temp',
      name: p.nome || 'Produto',
      width: p.largura || 20,
      height: p.altura || 20,
      length: p.comprimento || 20,
      weight: p.peso || 1,
      price: p.valor || 0,
      quantity: p.quantidade || 1
    }))

    // CEP origem padrão
    const origem = cepOrigem || '09835559'

    const cotacoes = await melhorEnvio.getShippingQuote({
      from: {
        zip: origem,
        street: 'Rua Exemplo',
        number: '100',
        complement: '',
        neighborhood: 'Centro',
        city: 'São Bernardo do Campo',
        state: 'SP'
      },
      to: {
        zip: cepDestino,
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      },
      products: products
    })

    // Formatar resposta
    const disponiveis = cotacoes.map((cotacao) => ({
      transportadora: cotacao.carrier?.name || 'Transportadora',
      servico: cotacao.name || 'Serviço',
      prazo: cotacao.delivery_time || 0,
      prazoString: cotacao.delivery_time_string || `${cotacao.delivery_time} dias`,
      preco: cotacao.price || 0,
      codigo: String(cotacao.id),
      imagem: cotacao.carrier?.picture || ''
    })).filter((c: any) => c.preco > 0)

    return NextResponse.json({
      success: true,
      cotacoes: disponiveis,
      total: disponiveis.length
    })

  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao calcular frete',
        success: false 
      },
      { status: 500 }
    )
  }
}