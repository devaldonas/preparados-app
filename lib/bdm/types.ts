// lib/bdm/types.ts
export interface BDMPaymentRequest {
  partnerEmail: string
  amount: number
  toAsset: 'BDM'
  fromAsset: 'BRL'
  attachment?: string
}

export interface BDMPaymentResponse {
  qrCode: string
  billingCode: string
  id: string
  status: string
}

export interface BDMWebhookPayload {
  event: 'TRANSFER_CONFIRMED' | 'TRANSFER_CANCELLED'
  id: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  email: string
  amount: number
  paidAt: string
  currency: 'BDM'
  billingCodeId: string
}

export interface BDMConfig {
  apiKey: string
  partnerEmail: string
  baseUrl: string
}