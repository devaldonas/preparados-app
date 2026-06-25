// lib/bdm/client.ts
import { BDMConfig, BDMPaymentRequest, BDMPaymentResponse, BDMWebhookPayload } from './types'

const BDM_CONFIG: BDMConfig = {
  apiKey: process.env.BDM_API_KEY || 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8=',
  partnerEmail: process.env.BDM_PARTNER_EMAIL || 'ed@conexaobdm.com.br',
  baseUrl: 'https://partner.douradocash.com.br/ecommerce-partner'
}

export class BDMClient {
  private config: BDMConfig

  constructor(config?: Partial<BDMConfig>) {
    this.config = { ...BDM_CONFIG, ...config }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = {
      'x-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`BDM API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Gerar QR Code PIX para pagamento via BDM
   */
  async generateQRCode(amount: number, attachment?: string): Promise<BDMPaymentResponse> {
    const payload: BDMPaymentRequest = {
      partnerEmail: this.config.partnerEmail,
      amount,
      toAsset: 'BDM',
      fromAsset: 'BRL',
      attachment: attachment || `#ORDER-${Date.now()}`
    }

    return this.request<BDMPaymentResponse>('/billing-code', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * Registrar webhook para receber confirmações
   */
  async registerWebhook(url: string): Promise<void> {
    await this.request('/webhooks', {
      method: 'PATCH',
      body: JSON.stringify({
        url,
        partnerEmail: this.config.partnerEmail
      })
    })
  }

  /**
   * Verificar status de um billing code
   */
  async getBillingStatus(billingCode: string): Promise<{ status: string; data: any }> {
    return this.request(`/clients/billingcode-status/${this.config.partnerEmail}/${billingCode}`)
  }

  /**
   * Cancelar transferência
   */
  async cancelTransfer(email: string, code: string): Promise<{ message: string }> {
    return this.request(`/clients/cancel-transfer/${email}/${code}`, {
      method: 'POST'
    })
  }

  /**
   * Executar cancelamento com 2FA
   */
  async executeCancelTransfer(email: string, code: string, twofaCode: string): Promise<{ message: string }> {
    return this.request(`/clients/cancel-transfer/execute/${email}/${code}/${twofaCode}`, {
      method: 'POST'
    })
  }

  /**
   * Obter cotação atual do BDM
   */
  async getQuotation(): Promise<{ rate: number; currency: string }> {
    return this.request('/clients/quotation/all/BDM')
  }

  /**
   * Listar transações por período
   */
  async getTransactions(initialDate: string, finalDate: string, size: number = 100): Promise<any[]> {
    return this.request(
      `/clients/transactions/${this.config.partnerEmail}?order=desc&initialDate=${initialDate}&finalDate=${finalDate}&size=${size}`
    )
  }
}

// Instância singleton
export const bdmClient = new BDMClient()