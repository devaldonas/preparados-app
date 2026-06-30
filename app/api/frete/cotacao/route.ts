// app/api/frete/cotacao/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cepOrigem = searchParams.get('cepOrigem')
    const cepDestino = searchParams.get('cepDestino')
    const servicoId = searchParams.get('servicoId')
    const produtoId = searchParams.get('produtoId')

    // Validar CEP de destino
    if (!cepDestino) {
      return NextResponse.json(
        { error: 'CEP de destino é obrigatório', success: false },
        { status: 400 }
      )
    }

    // Se for uma consulta de serviços disponíveis
    if (!servicoId) {
      // Buscar serviços disponíveis
      const servicos = await melhorEnvio.getAvailableServices()
      
      // Filtrar serviços ativos (opcional)
      const ativos = servicos.filter((s: any) => s.active !== false)

      // Se tiver CEP de origem e destino, calcular cotações básicas
      if (cepOrigem) {
        // Buscar cotações rápidas para cada serviço
        const cotacoes = await Promise.all(
          ativos.slice(0, 5).map(async (servico: any) => {
            try {
              const quote = await melhorEnvio.getShippingQuote({
                from: {
                  zip: cepOrigem,
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  city: '',
                  state: ''
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
                products: [
                  {
                    id: produtoId || 'produto-teste',
                    name: 'Produto Teste',
                    width: 20,
                    height: 20,
                    length: 20,
                    weight: 1,
                    price: 100,
                    quantity: 1
                  }
                ],
                services: [String(servico.id)]
              })

              return {
                servico: servico,
                cotacao: quote.length > 0 ? quote[0] : null
              }
            } catch (error) {
              return {
                servico: servico,
                cotacao: null,
                error: error instanceof Error ? error.message : 'Erro na cotação'
              }
            }
          })
        )

        return NextResponse.json({
          success: true,
          servicos: cotacoes
        })
      }

      return NextResponse.json({
        success: true,
        servicos: ativos
      })
    }

    // Buscar cotação para um serviço específico
    if (cepOrigem && servicoId) {
      const cotacao = await melhorEnvio.getShippingQuote({
        from: {
          zip: cepOrigem,
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: ''
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
        products: [
          {
            id: produtoId || 'produto-teste',
            name: 'Produto Teste',
            width: 20,
            height: 20,
            length: 20,
            weight: 1,
            price: 100,
            quantity: 1
          }
        ],
        services: [servicoId]
      })

      return NextResponse.json({
        success: true,
        cotacao: cotacao.length > 0 ? cotacao[0] : null
      })
    }

    // Se chegou aqui, retornar lista de serviços
    const servicos = await melhorEnvio.getAvailableServices()
    const ativos = servicos.filter((s: any) => s.active !== false)

    return NextResponse.json({
      success: true,
      servicos: ativos
    })

  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao buscar cotações',
        success: false 
      },
      { status: 500 }
    )
  }
}