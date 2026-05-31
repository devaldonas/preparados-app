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

      // Criar SVG para o marcador
      const markerSvg = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${markerColor}" stroke="white" stroke-width="3"/>
        </svg>
      `
      const markerUrl = `data:image/svg+xml;utf8,${encodeURIComponent(markerSvg)}`

      const marker = new google.maps.Marker({
        position,
        map,
        title: location.userName || 'Preparado',
        icon: {
          url: markerUrl,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
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

      // Listener único com log
      marker.addListener('click', () => {
        console.log('🔍 Marcador clicado:', {
          nome: location.userName,
          groupId: location.groupId,
          userId: location.userId
        })
        infoWindow.open(map, marker)
        setTimeout(() => infoWindow.close(), 2000)
        
        if (location.groupId) {
          onGroupSelect?.(location.groupId)
        } else {
          console.warn('⚠️ Marcador sem groupId:', location.userName)
          onGroupSelect?.(1)
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