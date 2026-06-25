// app/api/bdm/quotation/route.ts (CORRIGIDO)
import { NextResponse } from 'next/server'

const BDM_API_KEY = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
const BDM_API_URL = 'https://partner.douradocash.com.br/ecommerce-partner'

export async function GET() {
  try {
    console.log('📊 Buscando cotação BDM...')

    const response = await fetch(`${BDM_API_URL}/clients/quotation/all/BDM`, {
      headers: {
        'x-api-key': BDM_API_KEY,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    console.log('📥 Resposta completa da cotação:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP ${response.status}`)
    }

    // A cotação está no campo BRL
    let cotacao = null

    // Estrutura: { BRL: 13.58, USD: 2.61, asset: "BDM" }
    if (data.BRL && typeof data.BRL === 'number') {
      cotacao = data.BRL
    }
    // Fallback para outras estruturas
    else if (data.rate && typeof data.rate === 'number') {
      cotacao = data.rate
    }
    else if (data.price && typeof data.price === 'number') {
      cotacao = data.price
    }
    else if (data.quotation && typeof data.quotation === 'number') {
      cotacao = data.quotation
    }

    if (!cotacao) {
      console.error('❌ Não foi possível extrair a cotação da resposta:', data)
      throw new Error(`Cotação não encontrada na resposta. Campos disponíveis: ${Object.keys(data).join(', ')}`)
    }

    console.log(`✅ Cotação encontrada: 1 BDM = R$ ${cotacao}`)

    return NextResponse.json({
      success: true,
      quotation: cotacao,
      raw: data
    })

  } catch (error) {
    console.error('❌ Erro ao buscar cotação:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar cotação'
      },
      { status: 500 }
    )
  }
}