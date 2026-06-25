// app/api/bdm/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { validateBDMWebhook, processBDMWebhook } from '@/lib/bdm/webhook'
import { BDMWebhookPayload } from '@/lib/bdm/types'

const BDM_WEBHOOK_SECRET = process.env.BDM_WEBHOOK_SECRET || 'seu-secret-aqui'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-signature') || ''

    // Validar assinatura
    if (!validateBDMWebhook(body, signature, BDM_WEBHOOK_SECRET)) {
      console.error('Assinatura inválida no webhook')
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      )
    }

    // Processar evento
    const event = processBDMWebhook(body as BDMWebhookPayload)

    // Atualizar pedido no Supabase
    if (event.status === 'confirmed') {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.orderId)

      if (error) {
        console.error('Erro ao atualizar pedido:', error)
        return NextResponse.json(
          { error: 'Erro ao processar pedido' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}