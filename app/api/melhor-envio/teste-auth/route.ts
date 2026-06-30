// app/api/melhor-envio/teste-auth/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID || '10096'
    const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET || 'gZNCAEdvH73a0sOdCmOjcHfkurwhXQK20inPfFHb'
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true'
    
    const url = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/oauth/token'
      : 'https://melhorenvio.com.br/oauth/token'

    console.log('🔐 Tentando autenticar com Melhor Envio...')
    console.log('URL:', url)
    console.log('Client ID:', clientId)
    console.log('Client Secret:', clientSecret ? '✅ Presente' : '❌ Ausente')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    const data = await response.json()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
      url: url,
      config: {
        clientId: clientId,
        hasSecret: !!clientSecret,
        isSandbox: isSandbox
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}