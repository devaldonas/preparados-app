// app/api/bdm/teste/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BDM_API_KEY = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
const BDM_PARTNER_EMAIL = 'ed@conexaobdm.com.br'
const BDM_API_URL = 'https://partner.douradocash.com.br/ecommerce-partner'

// Lista de variações de cabeçalho para testar - com tipo explícito
interface TesteVariacao {
  name: string
  headers: Record<string, string>
}

const VARIACOES: TesteVariacao[] = [
  { 
    name: 'x-api-key (original)', 
    headers: { 'x-api-key': BDM_API_KEY } 
  },
  { 
    name: 'Bearer', 
    headers: { 'Authorization': `Bearer ${BDM_API_KEY}` } 
  },
  { 
    name: 'ApiKey', 
    headers: { 'Authorization': `ApiKey ${BDM_API_KEY}` } 
  },
  { 
    name: 'X-API-Key (maiúsculo)', 
    headers: { 'X-API-Key': BDM_API_KEY } 
  },
  { 
    name: 'api-key (minúsculo)', 
    headers: { 'api-key': BDM_API_KEY } 
  },
  { 
    name: 'x-api-key + email', 
    headers: { 
      'x-api-key': BDM_API_KEY, 
      'x-partner-email': BDM_PARTNER_EMAIL 
    } 
  },
  { 
    name: 'Bearer + email', 
    headers: { 
      'Authorization': `Bearer ${BDM_API_KEY}`,
      'x-partner-email': BDM_PARTNER_EMAIL
    } 
  },
  { 
    name: 'X-API-Key + email', 
    headers: { 
      'X-API-Key': BDM_API_KEY,
      'x-partner-email': BDM_PARTNER_EMAIL
    } 
  }
]

export async function GET() {
  const results = []

  for (const variacao of VARIACOES) {
    try {
      console.log(`🧪 Testando: ${variacao.name}`)

      // Construir headers explicitamente
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...variacao.headers
      }

      const response = await fetch(`${BDM_API_URL}/billing-code`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify({
          partnerEmail: BDM_PARTNER_EMAIL,
          amount: 10,
          toAsset: 'BDM',
          fromAsset: 'BRL',
          attachment: '#TESTE'
        })
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { raw: text }
      }

      results.push({
        variacao: variacao.name,
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers)
      })

      console.log(`📥 ${variacao.name}: ${response.status} ${response.ok ? '✅' : '❌'}`)

    } catch (error) {
      console.error(`❌ ${variacao.name}:`, error)
      results.push({
        variacao: variacao.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  // Encontrar qual funcionou
  const sucessos = results.filter(r => r.ok)
  const conclusao = sucessos.length > 0 
    ? `✅ ${sucessos.length} variação(ões) funcionaram! Use: ${sucessos[0].variacao}`
    : '❌ Nenhuma variação funcionou. Verifique as credenciais.'

  return NextResponse.json({
    total_testados: results.length,
    sucessos: sucessos.length,
    results: results,
    conclusao: conclusao,
    recomendacao: sucessos.length > 0 ? {
      header: sucessos[0].variacao,
      exemplo: getExemploHeader(sucessos[0].variacao)
    } : null
  })
}

function getExemploHeader(variacao: string): Record<string, string> | null {
  const encontrado = VARIACOES.find(v => v.name === variacao)
  return encontrado ? encontrado.headers : null
}