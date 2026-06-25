// app/api/bdm/teste-cotacao/route.ts
import { NextResponse } from 'next/server'

const BDM_API_KEY = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
const BDM_API_URL = 'https://partner.douradocash.com.br/ecommerce-partner'

export async function GET() {
  try {
    console.log('🧪 Teste: Buscando cotação BDM...')

    const response = await fetch(`${BDM_API_URL}/clients/quotation/all/BDM`, {
      headers: {
        'x-api-key': BDM_API_KEY,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data: data,
      estrutura: {
        keys: Object.keys(data),
        isArray: Array.isArray(data),
        hasRate: !!data.rate,
        hasPrice: !!data.price,
        hasBDM: !!data.BDM,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : null,
        rateValue: data.rate || null,
        priceValue: data.price || null,
        bdmValue: data.BDM || null,
        dataRate: data.data?.rate || null,
        dataPrice: data.data?.price || null,
        dataBDM: data.data?.BDM || null
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}