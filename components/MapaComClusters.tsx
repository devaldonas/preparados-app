'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface UserLocation {
  userId: string
  userName: string | null
  latitude: number
  longitude: number
  groupId: number | null
  cep: string
  mochila_tipo: string
  city: string | null
  state: string | null
}

interface MapaComClustersProps {
  userLocations: UserLocation[]
  onUserSelect?: (userId: string) => void
  showGroupsList?: boolean
}

// 🔥 CARREGAR O MAPA DINAMICAMENTE APENAS NO CLIENTE
const MapaLeaflet = dynamic<MapaComClustersProps>(
  () => import('./MapaLeaflet').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }
)

export default function MapaComClusters(props: MapaComClustersProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return <MapaLeaflet {...props} />
}