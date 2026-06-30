// app/api/frete/servicos/route.ts
import { NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

export async function GET() {
  try {
    const servicos = await melhorEnvio.getAvailableServices()
    
    return NextResponse.json({
      success: true,
      servicos: servicos
    })
  } catch (error) {
    console.error('Erro ao listar serviços:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao listar serviços',
        success: false 
      },
      { status: 500 }
    )
  }
}