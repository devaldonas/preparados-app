// app/api/radio-proxy/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const streamUrl = 'https://painel.radiosms.com.br:8056/stream/'

    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'audio',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // 🔥 TIMEOUT E RETRY
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar stream: ${response.status}`)
    }

    // 🔥 RETORNAR O STREAM COM HEADERS CORRETOS
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-transform',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ Erro no proxy de rádio:', error)
    return NextResponse.json(
      { error: 'Erro ao conectar ao stream' },
      { status: 500 }
    )
  }
}

// 🔥 RESPONDER OPTIONS PARA CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}