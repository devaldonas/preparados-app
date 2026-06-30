// app/api/frete/rastrear/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { melhorEnvio } from '@/lib/melhorenvio/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trackingCode = searchParams.get('codigo')

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'Código de rastreio é obrigatório', success: false },
        { status: 400 }
      )
    }

    const tracking = await melhorEnvio.getTrackingByCode(trackingCode)

    return NextResponse.json({
      success: true,
      tracking: {
        codigo: tracking.tracking,
        status: tracking.status,
        eventos: tracking.events?.map((event: any) => ({
          status: event.status,
          descricao: event.description,
          data: event.datetime,
          local: event.location
        })) || []
      }
    })

  } catch (error) {
    console.error('Erro ao rastrear pedido:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao rastrear pedido',
        success: false 
      },
      { status: 500 }
    )
  }
}