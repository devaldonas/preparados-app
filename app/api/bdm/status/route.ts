// app/api/bdm/status/route.ts (VERSÃO DE TESTE - MOCK)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const billingCode = searchParams.get('billingCode')

    console.log('🎯 TESTE: Verificando status BDM mock para:', billingCode)

    if (!billingCode) {
      return NextResponse.json(
        { error: 'billingCode é obrigatório' },
        { status: 400 }
      )
    }

    // Simular verificação de status
    // Em produção, isso chamaria a API real
    const mockStatus = {
      status: 'completed', // pending, completed, failed
      data: {
        billingCode: billingCode,
        amount: 10,
        status: 'COMPLETED',
        paidAt: new Date().toISOString()
      }
    }

    return NextResponse.json(mockStatus)

  } catch (error) {
    console.error('❌ Erro no mock status:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}