'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 🔥 CORRIGIR ÍCONES DO LEAFLET
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

// 🔥 IMPORTS DINÂMICOS DOS COMPONENTES DO REACT-LEAFLET
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

interface MapaLeafletProps {
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
  const { useMap } = require('react-leaflet')
  const map = useMap()
  
  useMemo(() => {
    if (map) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}

// 🔥 FUNÇÃO PARA GERAR ÍCONE COM BADGE
const getIconWithBadge = (count: number) => {
  const size = count > 1 ? 32 : 20
  const fontSize = count > 1 ? 12 : 0
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#FFB800" stroke="white" stroke-width="2"/>
        ${count > 1 ? `<text x="${size/2}" y="${size/2 + fontSize/2 - 1}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#000" text-anchor="middle">${count}</text>` : ''}
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    className: 'custom-marker',
  })
}

export default function MapaLeaflet({ 
  userLocations, 
  onUserSelect,
  showGroupsList = false
}: MapaLeafletProps) {
  const center: [number, number] = [-14.2350, -51.9253]
  const zoom = 4

  // 🔥 AGRUPAR USUÁRIOS POR COORDENADA
  const usuariosAgrupados = useMemo(() => {
    if (!userLocations || !Array.isArray(userLocations) || userLocations.length === 0) {
      return []
    }

    const grupos = new Map<string, UserLocation[]>()

    userLocations.forEach((loc) => {
      if (!loc || !loc.latitude || !loc.longitude) return
      
      // Chave: coordenada com 6 casas decimais (evita duplicatas por precisão)
      const key = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`
      
      if (!grupos.has(key)) {
        grupos.set(key, [])
      }
      grupos.get(key)!.push(loc)
    })

    return Array.from(grupos.values())
  }, [userLocations])

  // 🔥 AGRUPAR POR CIDADE (para o `showGroupsList`)
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

  // Cache de ícones pra não recriar a cada render
  const iconCache = useMemo(() => {
    const cache = new Map<number, L.Icon>()
    return {
      get: (count: number) => {
        if (!cache.has(count)) {
          cache.set(count, getIconWithBadge(count))
        }
        return cache.get(count)!
      }
    }
  }, [])

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={center} zoom={zoom} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* 🔥 MARCADORES DOS USUÁRIOS (AGRUPADOS POR COORDENADA) */}
        {usuariosAgrupados.map((grupo) => {
          const primeiro = grupo[0]
          const count = grupo.length
          const key = `${primeiro.latitude.toFixed(6)},${primeiro.longitude.toFixed(6)}`

          return (
            <Marker
              key={key}
              position={[primeiro.latitude, primeiro.longitude]}
              icon={iconCache.get(count)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  {count === 1 ? (
                    // 🔥 1 usuário: popup normal
                    <div className="text-center">
                      {primeiro.userName && (
                        <p className="font-bold text-sm text-gray-900 mb-1">
                          {primeiro.userName}
                        </p>
                      )}
                      {primeiro.city && (
                        <p className="text-xs text-gray-600 mb-2">
                          📍 {primeiro.city}{primeiro.state ? `, ${primeiro.state}` : ''}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          if (onUserSelect) {
                            onUserSelect(primeiro.userId)
                          }
                        }}
                        className="w-full bg-[#FFB800] text-black text-xs font-semibold py-1.5 rounded-lg hover:bg-[#E5A600] transition"
                      >
                        Entrar no chat
                      </button>
                    </div>
                  ) : (
                    // 🔥 2+ usuários: lista de todos
                    <div>
                      <p className="font-bold text-sm text-gray-900 mb-2 text-center">
                        {count} preparados aqui
                      </p>
                      {primeiro.city && (
                        <p className="text-xs text-gray-600 mb-2 text-center">
                          📍 {primeiro.city}{primeiro.state ? `, ${primeiro.state}` : ''}
                        </p>
                      )}
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {grupo.map((u) => (
                          <button
                            key={u.userId}
                            onClick={() => {
                              if (onUserSelect) {
                                onUserSelect(u.userId)
                              }
                            }}
                            className="w-full text-left bg-gray-50 hover:bg-[#FFB800]/10 border border-gray-200 rounded-lg px-2 py-1.5 transition"
                          >
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {u.userName || 'Sem nome'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                      <p className="font-bold text-sm text-gray-900">
                        {city === 'Sem cidade' ? 'Sem cidade definida' : city}
                      </p>
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
