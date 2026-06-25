// lib/bdm/payment.ts
import { bdmClient } from './client'
import { BDMPaymentResponse } from './types'

export interface PaymentResult {
  success: boolean
  qrCode?: string
  billingCode?: string
  transactionId?: string
  error?: string
}

/**
 * Processar pagamento via BDM Digital
 */
export async function processBDMPayment(
  amount: number,
  orderId: string,
  attachment?: string
): Promise<PaymentResult> {
  try {
    // 1. Validar valor mínimo
    if (amount < 0.01) {
      return {
        success: false,
        error: 'Valor mínimo para pagamento é R$ 0,01'
      }
    }

    // 2. Gerar QR Code na BDM
    const result = await bdmClient.generateQRCode(amount, attachment || `#ORDER-${orderId}`)

    return {
      success: true,
      qrCode: result.qrCode,
      billingCode: result.billingCode,
      transactionId: result.id
    }

  } catch (error) {
    console.error('Erro ao processar pagamento BDM:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Verificar status de um pagamento BDM
 */
export async function checkBDMPaymentStatus(billingCode: string): Promise<{
  status: 'pending' | 'completed' | 'failed'
  data?: any
}> {
  try {
    const result = await bdmClient.getBillingStatus(billingCode)
    
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'FAILED': 'failed'
    }

    return {
      status: statusMap[result.status] || 'pending',
      data: result.data
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return { status: 'pending' }
  }
}