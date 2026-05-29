'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface PessoaMapa {
  id: string
  full_name: string
  latitude: number
  longitude: number
  distance: number
  mochila_tipo: string
  type: 'preparado' | 'base'
}

interface BaseApoio {
  id: string
  nome: string
  tipo: string
  latitude: number
  longitude: number
  endereco: string
}

// Importar Leaflet dinamicamente (evita erro de SSR)
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

import 'leaflet/dist/leaflet.css'

// Importar Leaflet para configuração
import L from 'leaflet'

// Configurar ícone padrão do Leaflet (apenas uma vez)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface MapaPreparadosProps {
  preparados: PessoaMapa[]
  userLocation: { lat: number; lng: number } | null
  bases?: BaseApoio[]
}

export default function MapaPreparados({ preparados, userLocation, bases = [] }: MapaPreparadosProps) {
  const [mapaCarregado, setMapaCarregado] = useState(false)

  const center = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [-23.5505, -46.6333]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapaCarregado(true)
    }
  }, [])

  // Criar ícone personalizado com círculo colorido e emoji
  const criarIconePersonalizado = (cor: string, emoji: string, tamanho: number = 32) => {
    const html = `
      <div style="
        background-color: ${cor};
        width: ${tamanho}px;
        height: ${tamanho}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${tamanho * 0.6}px;
      ">${emoji}</div>`
    
    return L.divIcon({
      html: html,
      className: 'custom-marker',
      iconSize: [tamanho, tamanho],
      iconAnchor: [tamanho / 2, tamanho],
      popupAnchor: [0, -tamanho / 2]
    })
  }

  // Ícones por tipo de mochila
  const getIconePreparado = (tipo: string) => {
    const config: Record<string, { cor: string; emoji: string }> = {
      EDC: { cor: '#4CAF50', emoji: '🎒' },
      BOB: { cor: '#FFB800', emoji: '🎒⚡' },
      BOLT: { cor: '#2196F3', emoji: '⛰️' }
    }
    const { cor, emoji } = config[tipo] || { cor: '#9E9E9E', emoji: '📍' }
    return criarIconePersonalizado(cor, emoji, 32)
  }

  // Ícone do usuário (destacado)
  const iconeUsuario = criarIconePersonalizado('#FFB800', '📍', 40)

  // Ícones para bases de apoio
  const getIconeBase = (tipo: string) => {
    const config: Record<string, { cor: string; emoji: string }> = {
      farmacia: { cor: '#E91E63', emoji: '💊' },
      posto: { cor: '#FF5722', emoji: '⛽' },
      abrigo: { cor: '#9C27B0', emoji: '🏠' }
    }
    const { cor, emoji } = config[tipo] || { cor: '#9E9E9E', emoji: '📍' }
    return criarIconePersonalizado(cor, emoji, 28)
  }

  if (!mapaCarregado) {
    return (
      <div className="h-[400px] bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <MapContainer
      center={[center[0], center[1]]}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Marcador do usuário */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={iconeUsuario}
        >
          <Popup>
            <div className="text-center">
              <strong>📍 Você está aqui</strong>
              <p className="text-xs text-gray-500 mt-1">Sua localização aproximada</p>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Marcadores dos preparados */}
      {preparados.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={getIconePreparado(p.mochila_tipo)}
        >
          <Popup>
            <div className="text-center">
              <strong>{p.full_name || 'Preparado'}</strong>
              <p className="text-sm text-gray-600 mt-1">
                {p.mochila_tipo === 'EDC' ? '🎒 EDC' : p.mochila_tipo === 'BOB' ? '🎒⚡ BOB' : '⛰️ BOLT'}
              </p>
              <p className="text-xs text-gray-500">
                {p.distance < 1 
                  ? `${Math.round(p.distance * 1000)}m de distância` 
                  : `${p.distance} km de distância`}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Marcadores das bases de apoio */}
      {bases.map((base) => (
        <Marker
          key={base.id}
          position={[base.latitude, base.longitude]}
          icon={getIconeBase(base.tipo)}
        >
          <Popup>
            <div className="text-center">
              <strong>{base.nome}</strong>
              <p className="text-xs text-gray-500 mt-1">{base.endereco}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-200">
                {base.tipo === 'farmacia' ? '💊 Farmácia' : 
                 base.tipo === 'posto' ? '⛽ Posto' : '🏠 Abrigo'}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}