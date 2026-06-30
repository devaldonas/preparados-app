// lib/melhorenvio/client.ts
import axios from 'axios'
import {
  MelhorEnvioConfig,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
  ShipmentRequest,
  ShipmentResponse,
  TrackingResponse
} from './types'

class MelhorEnvioClient {
  private config: MelhorEnvioConfig
  private accessToken: string | null = null
  private tokenExpiresAt: Date | null = null

  constructor() {
    this.config = {
      clientId: process.env.MELHOR_ENVIO_CLIENT_ID || '',
      clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || '',
      apiUrl: process.env.MELHOR_ENVIO_API_URL || 'https://www.melhorenvio.com.br/api/v2',
      isSandbox: process.env.MELHOR_ENVIO_SANDBOX === 'true'
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('⚠️ Melhor Envio: Credenciais não configuradas')
    }
  }

  private async getAccessToken(): Promise<string> {
    // Se o token ainda for válido, retornar
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken as string
    }

    // Validar credenciais
    if (!this.config.clientId || !this.config.clientSecret) {
      console.error('❌ Credenciais do Melhor Envio não configuradas')
      throw new Error('Credenciais do Melhor Envio não configuradas')
    }

    try {
      const response = await axios.post(`${this.config.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })

      const token = response.data?.access_token
      if (!token) {
        throw new Error('Token não retornado pela API')
      }

      this.accessToken = token
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in || 3600) * 1000)
      
      return this.accessToken as string
    } catch (error) {
      console.error('❌ Erro ao obter token do Melhor Envio:', error)
      throw new Error('Falha na autenticação com Melhor Envio')
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.getAccessToken()
    
    const url = `${this.config.apiUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'PREPARADO App (contato@preparado.com)'
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        data
      })

      return response.data
    } catch (error: any) {
      console.error(`❌ Erro na requisição Melhor Envio (${endpoint}):`, error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Cotar frete
   */
  async getShippingQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse[]> {
    try {
      const payload = {
        from: {
          postal_code: request.from.zip.replace(/\D/g, '')
        },
        to: {
          postal_code: request.to.zip.replace(/\D/g, '')
        },
        products: request.products.map(p => ({
          id: p.id,
          width: p.width,
          height: p.height,
          length: p.length,
          weight: p.weight,
          insurance_value: p.price,
          quantity: p.quantity
        })),
        services: request.services || undefined
      }

      return this.request<ShippingQuoteResponse[]>('POST', '/me/cart', payload)
    } catch (error) {
      console.error('❌ Erro ao cotar frete:', error)
      throw error
    }
  }

  /**
   * Criar uma etiqueta de envio
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const payload = {
        service: request.service_id,
        agency: request.agency_id,
        from: {
          name: request.from.street,
          phone: '',
          email: '',
          document: '',
          company_document: '',
          state_register: '',
          address: request.from.street,
          complement: request.from.complement || '',
          number: request.from.number,
          district: request.from.neighborhood,
          city: request.from.city,
          state_abbr: request.from.state,
          country_id: 'BR',
          postal_code: request.from.zip.replace(/\D/g, '')
        },
        to: {
          name: '',
          phone: '',
          email: '',
          document: '',
          company_document: '',
          state_register: '',
          address: request.to.street,
          complement: request.to.complement || '',
          number: request.to.number,
          district: request.to.neighborhood,
          city: request.to.city,
          state_abbr: request.to.state,
          country_id: 'BR',
          postal_code: request.to.zip.replace(/\D/g, '')
        },
        products: request.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          unit_price: p.price
        })),
        insurance_value: request.insurance_value,
        receipt: request.receipt,
        own_hand: request.own_hand,
        collect: request.collect,
        reverse: request.reverse,
        non_commercial: request.non_commercial,
        invoice: request.invoice
      }

      return this.request<ShipmentResponse>('POST', '/me/shipment', payload)
    } catch (error) {
      console.error('❌ Erro ao criar etiqueta:', error)
      throw error
    }
  }

  /**
   * Gerar etiqueta (pagar)
   */
  async generateShipmentLabel(shipmentId: number): Promise<ShipmentResponse> {
    try {
      return this.request<ShipmentResponse>('POST', `/me/shipment/${shipmentId}/generate`)
    } catch (error) {
      console.error('❌ Erro ao gerar etiqueta:', error)
      throw error
    }
  }

  /**
   * Cancelar etiqueta
   */
  async cancelShipment(shipmentId: number): Promise<{ success: boolean }> {
    try {
      return this.request<{ success: boolean }>('DELETE', `/me/shipment/${shipmentId}`)
    } catch (error) {
      console.error('❌ Erro ao cancelar etiqueta:', error)
      throw error
    }
  }

  /**
   * Rastrear etiqueta
   */
  async getTracking(shipmentId: number): Promise<TrackingResponse> {
    try {
      return this.request<TrackingResponse>('GET', `/me/shipment/${shipmentId}/tracking`)
    } catch (error) {
      console.error('❌ Erro ao rastrear etiqueta:', error)
      throw error
    }
  }

  /**
   * Rastrear por código de rastreio
   */
  async getTrackingByCode(trackingCode: string): Promise<TrackingResponse> {
    try {
      return this.request<TrackingResponse>('GET', `/me/shipment/tracking/${trackingCode}`)
    } catch (error) {
      console.error('❌ Erro ao rastrear por código:', error)
      throw error
    }
  }

  /**
   * Listar serviços de frete disponíveis
   */
  async getAvailableServices(): Promise<any[]> {
    try {
      return this.request<any[]>('GET', '/me/checkout/services')
    } catch (error) {
      console.error('❌ Erro ao listar serviços:', error)
      throw error
    }
  }

  /**
   * Obter informações de uma etiqueta
   */
  async getShipment(shipmentId: number): Promise<ShipmentResponse> {
    try {
      return this.request<ShipmentResponse>('GET', `/me/shipment/${shipmentId}`)
    } catch (error) {
      console.error('❌ Erro ao obter etiqueta:', error)
      throw error
    }
  }

  /**
   * Listar etiquetas
   */
  async listShipments(page: number = 1, perPage: number = 20): Promise<ShipmentResponse[]> {
    try {
      return this.request<ShipmentResponse[]>('GET', `/me/shipment?page=${page}&perPage=${perPage}`)
    } catch (error) {
      console.error('❌ Erro ao listar etiquetas:', error)
      throw error
    }
  }
}

// Exportar instância
export const melhorEnvio = new MelhorEnvioClient()