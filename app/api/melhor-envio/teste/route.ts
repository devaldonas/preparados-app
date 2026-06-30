// app/api/melhor-envio/teste/route.ts
import { NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

export async function GET() {
  try {
    // Testar se consegue obter token
    const token = await (melhorEnvio as any).getAccessToken()
    
    return NextResponse.json({
      success: true,
      message: '✅ Autenticação com Melhor Envio funcionando!',
      token: token.substring(0, 20) + '...' // Mostra só parte do token
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}