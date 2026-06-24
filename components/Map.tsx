'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface MapViewProps {
  className?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
  onMapReady?: (map: google.maps.Map) => void
}

export function MapView({
  className,
  initialCenter = { lat: -15.7942, lng: -47.8822 },
  initialZoom = 4,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (!API_KEY) {
      console.error('Google Maps API key is required')
      return
    }

    if (scriptLoaded) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=places,geocoding`
    script.async = true
    script.defer = true
    script.onload = () => {
      setScriptLoaded(true)
    }
    document.head.appendChild(script)
  }, [API_KEY, scriptLoaded])

  useEffect(() => {
    if (!scriptLoaded || !mapContainer.current) return

    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
    })
    
    if (onMapReady && map.current) {
      onMapReady(map.current)
    }
  }, [scriptLoaded, initialCenter, initialZoom, onMapReady])

  return <div ref={mapContainer} className={cn('w-full h-[500px] rounded-xl', className)} />
}