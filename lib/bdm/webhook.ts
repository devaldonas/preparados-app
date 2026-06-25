// lib/bdm/webhook.ts
import crypto from 'crypto'
import { BDMWebhookPayload } from './types'

/**
 * Validar assinatura do webhook BDM
 */
export function validateBDMWebhook(
  payload: Record<string, any>,
  signature: string,
  secret: string
): boolean {
  try {
    const jsonPayload = JSON.stringify(payload)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(jsonPayload)
      .digest('hex')
    
    return expectedSignature === signature
  } catch (error) {
    console.error('Erro ao validar assinatura:', error)
    return false
  }
}

/**
 * Processar evento do webhook BDM
 */
export function processBDMWebhook(payload: BDMWebhookPayload): {
  orderId: string
  status: 'confirmed' | 'cancelled'
  amount: number
  paidAt?: string
} {
  // Extrair orderId do billingCodeId
  // Exemplo: BDM_DIGITAL_829b4481-c28b-4c78-889b-bbb30e648d6d_94213
  const parts = payload.billingCodeId.split('_')
  const orderId = parts.length > 1 ? parts[parts.length - 1] : payload.billingCodeId

  return {
    orderId,
    status: payload.event === 'TRANSFER_CONFIRMED' ? 'confirmed' : 'cancelled',
    amount: payload.amount,
    paidAt: payload.paidAt
  }
}