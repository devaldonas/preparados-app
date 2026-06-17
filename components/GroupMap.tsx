'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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
  const groupMarkersRef = useRef<google.maps.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [allGroups, setAllGroups] = useState<any[]>([])
  const [showGroupsList, setShowGroupsList] = useState(false)
  const router = useRouter()

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

  const carregarTodosGrupos = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, member_count, center_latitude, center_longitude')
      .not('center_latitude', 'is', null)
      .not('center_longitude', 'is', null)
      .order('member_count', { ascending: false })
    
    if (error) {
      console.error('Erro ao carregar grupos:', error)
      return
    }
    
    if (data) {
      console.log('Grupos carregados:', data.length)
      setAllGroups(data)
      return data
    }
    
    return []
  }

  const abrirChatDoGrupo = (groupId: number | null, nomeGrupo?: string) => {
    if (groupId) {
      console.log(`Abrindo chat do grupo ${groupId} - ${nomeGrupo || ''}`)
      router.push(`/grupo/${groupId}`)
    } else {
      console.warn('Grupo inválido')
      alert('Este grupo não está disponível.')
    }
  }

  useEffect(() => {
    if (mapReady) {
      carregarTodosGrupos()
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current || allGroups.length === 0) return

    const map = mapRef.current
    
    groupMarkersRef.current.forEach((marker) => {
      marker.setMap(null)
    })
    groupMarkersRef.current = []

    allGroups.forEach((group) => {
      const lat = Number(group.center_latitude)
      const lng = Number(group.center_longitude)

      if (isNaN(lat) || isNaN(lng)) return

      const position = new google.maps.LatLng(lat, lng)

      // Usar imagem personalizada em vez do SVG com letra "G"
const markerUrl = '/images/markmap.png'

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${group.name} - ${group.member_count} membros`,
        icon: {
          url: markerUrl,
          scaledSize: new google.maps.Size(14, 24),
          anchor: new google.maps.Point(22, 22),
        },
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui; min-width: 220px;">
            <strong style="font-size: 16px;">${group.name}</strong><br/>
            <span style="color: #666;">Baseado em localizacao</span><br/>
            <span style="color: #FFB800; font-weight: bold;">${group.member_count} membros</span>
            <hr style="margin: 10px 0;">
            <button 
              id="groupChatBtn_${group.id}"
              style="
                width: 100%; 
                padding: 10px; 
                background-color: #FFB800; 
                color: black; 
                border: none; 
                border-radius: 8px; 
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
              "
              onclick="window.__openGroupChat(${group.id}, '${group.name}')"
            >
              Entrar no Chat do Grupo
            </button>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        setTimeout(() => {
          infoWindow.close()
        }, 8000)
      })

      groupMarkersRef.current.push(marker)
    })
  }, [allGroups, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

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

      const markerSvg = `
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="14" fill="${markerColor}" stroke="white" stroke-width="2.5"/>
          <text x="18" y="23" font-size="12" text-anchor="middle" fill="white" font-weight="bold">P</text>
        </svg>
      `
      const markerUrl = `data:image/svg+xml;utf8,${encodeURIComponent(markerSvg)}`

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${location.userName || 'Preparado'} - ${location.mochila_tipo}`,
        icon: {
          url: markerUrl,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
      })

      const groupId = location.groupId
      
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
            <strong style="font-size: 15px;">${location.userName || 'Preparado'}</strong><br/>
            <span style="color: #666;">CEP: ${location.cep}</span><br/>
            <span style="color: #666;">Mochila: ${location.mochila_tipo}</span><br/>
            <span style="color: #FFB800;">Grupo ID: ${groupId || 'Nenhum'}</span>
            <hr style="margin: 10px 0;">
            <button 
              onclick="window.__openGroupChat(${groupId || 1}, 'Chat do Usuario')"
              style="
                width: 100%; 
                padding: 8px; 
                background-color: #FFB800; 
                color: black; 
                border: none; 
                border-radius: 6px; 
                font-weight: bold;
                cursor: pointer;
              "
            >
              Conversar no Grupo
            </button>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        setTimeout(() => {
          infoWindow.close()
        }, 5000)
      })

      markersRef.current.push(marker)
    })

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds)
    }
  }, [userLocations, mapReady])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__openGroupChat = (groupId: number, groupName: string) => {
        console.log(`Abrindo chat do grupo: ${groupId} - ${groupName}`)
        router.push(`/grupo/${groupId}`)
      }
    }
  }, [router])

  return (
    <div className="relative">
      <MapView
        initialCenter={{ lat: -15.7942, lng: -47.8822 }}
        initialZoom={4}
        onMapReady={handleMapReady}
      />

      {showGroupsList && (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[500px] overflow-y-auto z-10">
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="font-bold text-lg">Todos os Grupos</h3>
            <p className="text-sm text-gray-500">Clique em qualquer grupo para entrar no chat</p>
          </div>
          <div className="p-2">
            {allGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Carregando grupos...</p>
              </div>
            ) : (
              allGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => abrirChatDoGrupo(group.id, group.name)}
                  className="w-full text-left p-3 mb-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                      <p className="text-xs text-gray-500">
                        {group.center_latitude?.toFixed(2)}, {group.center_longitude?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[#FFB800] font-bold">{group.member_count}</span>
                      <p className="text-xs text-gray-400">membros</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}