'use client'

import { useRef, useEffect, useState } from 'react'
import { MapView } from './Map'

interface UserLocation {
  userId: string
  userName: string | null
  latitude: number
  longitude: number
  groupId: number | null
  cep: string
  mochila_tipo: string
}

interface GroupMapProps {
  userLocations: UserLocation[]
  onGroupSelect?: (groupId: number | null) => void
}

export default function GroupMap({ userLocations, onGroupSelect }: GroupMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map
    setMapReady(true)
  }

  const getMarkerColor = (tipo: string) => {
    switch (tipo) {
      case 'EDC': return '#4CAF50'
      case 'BOB': return '#FFB800'
      case 'BOLT': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  // Limpar marcadores quando o componente desmontar ou userLocations mudar
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null)
      })
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    // Limpar marcadores antigos
    markersRef.current.forEach((marker) => {
      marker.setMap(null)
    })
    markersRef.current = []

    if (userLocations.length === 0) return

    const map = mapRef.current
    const bounds = new google.maps.LatLngBounds()

    userLocations.forEach((location) => {
      const lat = Number(location.latitude)
      const lng = Number(location.longitude)

      if (isNaN(lat) || isNaN(lng)) return

      const position = new google.maps.LatLng(lat, lng)
      bounds.extend(position)

      const markerColor = getMarkerColor(location.mochila_tipo)

      // Usar o marcador padrão do Google Maps com ícone customizado
      const marker = new google.maps.Marker({
        position,
        map,
        title: location.userName || 'Preparado',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
          scale: 14,
        },
        label: {
          text: '📍',
          color: 'white',
          fontSize: '12px',
        },
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui;">
            <strong>${location.userName || 'Preparado'}</strong><br/>
            CEP: ${location.cep}<br/>
            Tipo: ${location.mochila_tipo}
            ${location.groupId ? `<br/>Grupo: ${location.groupId}` : ''}
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        if (location.groupId) {
          onGroupSelect?.(location.groupId)
        }
      })

      markersRef.current.push(marker)
    })

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds)
    }
  }, [userLocations, mapReady, onGroupSelect])

  return (
    <MapView
      initialCenter={{ lat: -15.7942, lng: -47.8822 }}
      initialZoom={4}
      onMapReady={handleMapReady}
    />
  )
}