 export interface Profile {
  id: string
  full_name: string
  cep?: string
  latitude?: number
  longitude?: number
  mochila_tipo: 'EDC' | 'BOB' | 'BOLT'
  onboarding_completed: boolean
  created_at: string
}

export interface ChecklistItem {
  id: number
  category_id: number
  name: string
  description?: string
  order: number
  tipo: string[] // ['EDC', 'BOB', 'BOLT']
}

export interface UserProgress {
  user_id: string
  item_id: number
  completed: boolean
  updated_at: string
}

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  category: string
}
