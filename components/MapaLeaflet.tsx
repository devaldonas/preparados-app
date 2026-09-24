'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { User } from 'lucide-react'
import ModalMembros from './ModalMembros'

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

// 🔥 MarkerClusterGroup (dynamic) — DECLARADO ANTES DE USAR
const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster').then((mod) => mod.default as any),
  { ssr: false }
) as any

interface GrupoMapa {
  id: number
  name: string
  city_name: string
  member_count: number
  center_latitude: number
  center_longitude: number
}

interface MapaLeafletProps {
  grupos: GrupoMapa[]
  onEntrarNoChat?: (groupId: number) => void
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

// 🔥 FUNÇÃO PARA GERAR ÍCONE DO GRUPO
const getGroupIcon = (count: number) => {
  const size = 36
  const fontSize = count >= 10 ? 11 : 13
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#FFB800" stroke="white" stroke-width="2.5"/>
        <text x="${size/2}" y="${size/2 + fontSize/3}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#000" text-anchor="middle">${count}</text>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    className: 'custom-marker',
  })
}

// 🔥 FUNÇÃO PARA GERAR CLUSTER CUSTOMIZADO
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 40 : count < 100 ? 44 : 48
  
  return L.divIcon({
    html: `
      <div style="
        background-color: #FFB800;
        color: #000;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${size/3}px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster',
    iconSize: L.point(size, size),
  })
}

export default function MapaLeaflet({ grupos, onEntrarNoChat }: MapaLeafletProps) {
  const center: [number, number] = [-14.2350, -51.9253]
  const zoom = 4

  const [grupoSelecionado, setGrupoSelecionado] = useState<GrupoMapa | null>(null)

  // Cache de ícones
  const iconCache = useMemo(() => {
    const cache = new Map<number, L.Icon>()
    return {
      get: (count: number) => {
        if (!cache.has(count)) {
          cache.set(count, getGroupIcon(count))
        }
        return cache.get(count)!
      }
    }
  }, [])

  // Filtra grupos com coordenadas válidas
  const gruposValidos = useMemo(() => {
    return (grupos || []).filter(
      (g) => g.center_latitude && g.center_longitude
    )
  }, [grupos])

  return (
    <>
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

          {/* 🔥 MARCADORES DOS GRUPOS COM CLUSTER */}
          <MarkerClusterGroup
            iconCreateFunction={createClusterIcon}
            showCoverageOnHover={false}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            disableClusteringAtZoom={12}
          >
            {gruposValidos.map((grupo) => (
              <Marker
                key={grupo.id}
                position={[grupo.center_latitude, grupo.center_longitude]}
                icon={iconCache.get(grupo.member_count)}
              >
                <Popup>
                  <div className="p-1 min-w-[140px] max-w-[160px]">
                    <div className="text-center mb-2">
                      <p className="font-bold text-sm text-gray-900">
                        {grupo.city_name || grupo.name}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          if (onEntrarNoChat) {
                            onEntrarNoChat(grupo.id)
                          }
                        }}
                        className="w-full bg-[#FFB800] text-black text-xs font-semibold py-1.5 px-2 rounded-md hover:bg-[#E5A600] transition"
                      >
                        Entrar no chat
                      </button>
                      
                      <button
                        onClick={() => setGrupoSelecionado(grupo)}
                        className="w-full bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 px-2 rounded-md hover:bg-gray-200 transition flex items-center justify-center gap-1"
                      >
                        <User size={11} />
                        {grupo.member_count} {grupo.member_count === 1 ? 'membro' : 'membros'}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* 🔥 MODAL DE MEMBROS */}
      <ModalMembros
        grupo={grupoSelecionado ? {
          id: grupoSelecionado.id,
          name: grupoSelecionado.name,
          city_name: grupoSelecionado.city_name,
          member_count: grupoSelecionado.member_count
        } : null}
        aberto={!!grupoSelecionado}
        onFechar={() => setGrupoSelecionado(null)}
      />
    </>
  )
}
