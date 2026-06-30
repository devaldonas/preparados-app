// lib/melhorenvio/types.ts
export interface MelhorEnvioConfig {
  clientId: string
  clientSecret: string
  apiUrl: string
  isSandbox: boolean
}

export interface Address {
  zip: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  country?: string
}

export interface Product {
  id?: string
  name: string
  width: number // cm
  height: number // cm
  length: number // cm
  weight: number // kg
  price: number
  quantity: number
}

export interface ShippingQuoteRequest {
  from: Address
  to: Address
  products: Product[]
  services?: string[]
}

export interface ShippingQuoteResponse {
  id: number
  name: string
  price: number
  delivery_time: number
  delivery_time_string: string
  carrier: {
    id: number
    name: string
    picture: string
  }
}

export interface ShipmentRequest {
  service_id: number
  agency_id?: number
  from: Address
  to: Address
  products: Product[]
  insurance_value: number
  receipt: boolean
  own_hand: boolean
  collect: boolean
  reverse: boolean
  non_commercial: boolean
  invoice?: {
    key: string
    number: string
    serie: string
    date: string
    cfop: string
    items: Array<{
      description: string
      quantity: number
      unit_price: number
    }>
  }
}

export interface ShipmentResponse {
  id: number
  status: string
  tracking: string
  pdf: string
  price: number
  paid_at: string
  created_at: string
  updated_at: string
  tags: string[]
  services: {
    id: number
    name: string
    carrier: {
      id: number
      name: string
      picture: string
    }
  }
}

export interface TrackingResponse {
  tracking: string
  status: string
  events: Array<{
    status: string
    description: string
    datetime: string
    location: string
  }>
}