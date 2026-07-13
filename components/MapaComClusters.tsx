'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 🔥 CORRIGIR ÍCONES DO LEAFLET (apenas no cliente)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

// 🔥 IMPORTS DINÂMICOS DO REACT-LEAFLET
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)

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

// 🔥 CORES PARA CIDADES
const getCityColor = (city: string | null): string => {
  const colors = [
    '#FFB800', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8A5C',
    '#74B9FF', '#A29BFE', '#FD79A8', '#00B894'
  ]
  let hash = 0
  if (city) {
    for (let i = 0; i < city.length; i++) {
      hash = city.charCodeAt(i) + ((hash << 5) - hash)
    }
  }
  return colors[Math.abs(hash) % colors.length]
}

// 🔥 COMPONENTE MAP CONTROLLER
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const [map, setMap] = useState<any>(null)
  
  useEffect(() => {
    import('react-leaflet').then((mod) => {
      const mapInstance = mod.useMap()
      setMap(mapInstance)
    })
  }, [])
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}

export default function MapaComClusters({ 
  userLocations, 
  onUserSelect,
  showGroupsList = false
}: MapaComClustersProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 🔥 CENTRO DO MAPA (BRASIL)
  const center: [number, number] = [-14.2350, -51.9253]
  const zoom = 4

  // 🔥 AGRUPAR USUÁRIOS POR CIDADE
  const gruposPorCidade = useMemo(() => {
    const gruposMap = new Map<string, UserLocation[]>()
    if (!userLocations || !Array.isArray(userLocations) || userLocations.length === 0) {
      return gruposMap
    }
    userLocations.forEach((loc) => {
      if (!loc) return
      const key = loc.city || 'Sem cidade'
      if (!gruposMap.has(key)) {
        gruposMap.set(key, [])
      }
      gruposMap.get(key)!.push(loc)
    })
    return gruposMap
  }, [userLocations])

  // 🔥 ÍCONE PERSONALIZADO AMARELO
  const customIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFB800" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="8"/>
      </svg>
    `),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: 'custom-marker'
  })

  if (!isClient) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* 🔥 MARCADORES DOS USUÁRIOS */}
        {userLocations && Array.isArray(userLocations) && userLocations.map((loc) => {
          if (!loc || !loc.latitude || !loc.longitude) return null
          
          return (
            <Marker
              key={loc.userId}
              position={[loc.latitude, loc.longitude]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <p className="font-bold text-sm text-gray-900">
                    {loc.userName || 'Preparado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    🎒 {loc.mochila_tipo || 'BOB'}
                  </p>
                  {loc.city && (
                    <p className="text-xs text-gray-500">📍 {loc.city}</p>
                  )}
                  <button
                    onClick={() => {
                      if (onUserSelect) {
                        onUserSelect(loc.userId)
                      }
                    }}
                    className="mt-2 w-full bg-[#FFB800] text-black text-xs font-semibold py-1 rounded-lg hover:bg-[#E5A600] transition"
                  >
                    Entrar no chat
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 🔥 GRUPOS POR CIDADE */}
        {showGroupsList && gruposPorCidade.size > 0 && (
          <>
            {Array.from(gruposPorCidade.entries()).map(([city, locations]) => {
              if (!locations || locations.length === 0) return null
              
              const centerLat = locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length
              const centerLng = locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length
              const color = getCityColor(city)
              const size = Math.min(40 + locations.length * 2, 60)
              const displayName = city === 'Sem cidade' ? 'Sem cidade definida' : city
              
              return (
                <CircleMarker
                  key={city}
                  center={[centerLat, centerLng]}
                  radius={size / 2}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.8
                  }}
                >
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="font-bold text-sm text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">{locations.length} pessoas</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </>
        )}
      </MapContainer>
    </div>
  )
}