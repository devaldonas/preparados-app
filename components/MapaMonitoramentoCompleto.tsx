// components/MapaMonitoramentoCompleto.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// 🔥 IMPORTS DINÂMICOS (SSR: false)
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
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
)

interface DisasterEvent {
  id: string
  type: string
  typeCode: string
  title: string
  description: string
  latitude: number
  longitude: number
  magnitude?: number
  depth?: number
  alertLevel: 'green' | 'orange' | 'red'
  alertLevelLabel: string
  date: string
  country: string
  region: string
  source: string
}

// 🔥 CORES POR TIPO DE DESASTRE
const disasterColors: Record<string, string> = {
  'Terremoto': '#FF4444',
  'Inundação': '#4488FF',
  'Ciclone': '#AA44FF',
  'Incêndio': '#FF8800',
  'Vulcão': '#CC0000',
  'Seca': '#CC8844',
  'Tsunami': '#00AAAA',
  'Desconhecido': '#888888'
}

// 🔥 CORES POR NÍVEL DE ALERTA
const alertColors: Record<string, string> = {
  'red': '#FF0000',
  'orange': '#FF8800',
  'green': '#00CC44'
}

// 🔥 ETIQUETAS POR TIPO (SEM EMOJIS)
const disasterLabels: Record<string, string> = {
  'Terremoto': 'Terremoto',
  'Inundação': 'Inundação',
  'Ciclone': 'Ciclone',
  'Incêndio': 'Incêndio',
  'Vulcão': 'Vulcão',
  'Seca': 'Seca',
  'Tsunami': 'Tsunami',
  'Desconhecido': 'Desconhecido'
}

// 🔥 ESCALA DE MAGNITUDE RICHTER - DETALHADA
const getMagnitudeRichter = (magnitude: number): string => {
  if (magnitude >= 9.0) return '≥ 9.0 - Catastrófico'
  if (magnitude >= 8.0) return '8.0 - 8.9 - Grande'
  if (magnitude >= 7.0) return '7.0 - 7.9 - Forte'
  if (magnitude >= 6.0) return '6.0 - 6.9 - Moderado'
  if (magnitude >= 5.0) return '5.0 - 5.9 - Médio'
  if (magnitude >= 4.0) return '4.0 - 4.9 - Leve'
  if (magnitude >= 3.0) return '3.0 - 3.9 - Pequeno'
  if (magnitude >= 2.0) return '2.0 - 2.9 - Muito Pequeno'
  return '< 2.0 - Micro'
}

// 🔥 ESCALA DE INTENSIDADE (Mercalli Modificada)
const getIntensityLabel = (magnitude: number): string => {
  if (magnitude >= 9.0) return 'Extrema'
  if (magnitude >= 8.0) return 'Severa'
  if (magnitude >= 7.0) return 'Forte'
  if (magnitude >= 6.0) return 'Moderada'
  if (magnitude >= 5.0) return 'Média'
  if (magnitude >= 4.0) return 'Leve'
  if (magnitude >= 3.0) return 'Pequena'
  return 'Muito Pequena'
}

// 🔥 FUNÇÃO PARA CALCULAR RAIO DO CÍRCULO (baseado na magnitude)
const getCircleRadius = (event: DisasterEvent): number => {
  if (event.type === 'Terremoto' && event.magnitude) {
    // Raio baseado na magnitude: quanto maior a magnitude, maior o círculo
    return Math.pow(2, event.magnitude - 3) * 5
  }
  if (event.type === 'Inundação') {
    return event.alertLevel === 'red' ? 150 : 
           event.alertLevel === 'orange' ? 80 : 30
  }
  if (event.type === 'Ciclone') {
    return event.alertLevel === 'red' ? 200 : 
           event.alertLevel === 'orange' ? 120 : 50
  }
  if (event.type === 'Incêndio') {
    return event.alertLevel === 'red' ? 80 : 
           event.alertLevel === 'orange' ? 40 : 15
  }
  if (event.type === 'Vulcão') {
    return event.alertLevel === 'red' ? 100 : 
           event.alertLevel === 'orange' ? 60 : 25
  }
  return 20
}

// 🔥 FILTROS (SEM EMOJIS)
const disasterTypes = [
  { value: 'ALL', label: 'Todos' },
  { value: 'Terremoto', label: 'Terremotos' },
  { value: 'Inundação', label: 'Inundações' },
  { value: 'Ciclone', label: 'Ciclones' },
  { value: 'Incêndio', label: 'Incêndios' },
  { value: 'Vulcão', label: 'Vulcões' },
  { value: 'Seca', label: 'Secas' },
]

const alertLevels = [
  { value: 'ALL', label: 'Todos' },
  { value: 'red', label: 'Crítico' },
  { value: 'orange', label: 'Alerta' },
  { value: 'green', label: 'Monitoramento' },
]

export default function MapaMonitoramentoCompleto() {
  const [events, setEvents] = useState<DisasterEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')
  const [filterAlert, setFilterAlert] = useState('ALL')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, red: 0, orange: 0, green: 0 })
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)

  const center: [number, number] = [-14.2350, -51.9253]
  const zoom = 4

  useEffect(() => {
    setIsClient(true)
    
    // 🔥 CARREGAR LEAFLET APENAS NO CLIENTE
    import('leaflet').then((module) => {
      const leaflet = module.default
      
      // 🔥 CORRIGIR ÍCONES DO LEAFLET
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
      
      setL(leaflet)
      carregarEventos()
    })
  }, [])

  const carregarEventos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/disasters')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar eventos')
      }

      setEvents(data.events || [])
      
      const stats = {
        total: data.events?.length || 0,
        red: data.events?.filter((e: DisasterEvent) => e.alertLevel === 'red').length || 0,
        orange: data.events?.filter((e: DisasterEvent) => e.alertLevel === 'orange').length || 0,
        green: data.events?.filter((e: DisasterEvent) => e.alertLevel === 'green').length || 0,
      }
      setStats(stats)

    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error)
      setError('Erro ao carregar dados de monitoramento')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 FUNÇÃO PARA CRIAR ÍCONE (SEM EMOJIS)
  const createIcon = (type: string, alertLevel: string, magnitude?: number) => {
    if (!L) return null
    
    const alertColor = alertColors[alertLevel] || '#888888'
    
    // Texto do ícone baseado no tipo
    let iconText = '⚠'
    if (type === 'Terremoto') iconText = 'M'
    else if (type === 'Inundação') iconText = 'I'
    else if (type === 'Ciclone') iconText = 'C'
    else if (type === 'Incêndio') iconText = 'F'
    else if (type === 'Vulcão') iconText = 'V'
    else if (type === 'Seca') iconText = 'S'
    else if (type === 'Tsunami') iconText = 'T'
    
    return L.divIcon({
      className: 'custom-disaster-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${alertColor};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          font-family: Arial, sans-serif;
        ">
          ${iconText}
          ${magnitude ? `<span style="font-size:8px;margin-left:1px;">${Math.round(magnitude)}</span>` : ''}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    })
  }

  const filteredEvents = events.filter(event => {
    if (filterType !== 'ALL' && event.type !== filterType) return false
    if (filterAlert !== 'ALL' && event.alertLevel !== filterAlert) return false
    return true
  })

  const formatDate = (date: string) => {
    const d = new Date(date)
    d.setHours(d.getHours() - 3)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isClient || !L || loading) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800] mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Carregando monitoramento global...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={carregarEventos}
            className="mt-4 bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* HEADER */}
      <div className="bg-[#FFB800] p-3 rounded-t-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-black">Monitoramento Global</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-black/80">
            <span>📍 {stats.total} eventos</span>
            <span className="text-red-600">● {stats.red} crítico</span>
            <span className="text-orange-500">● {stats.orange} alerta</span>
            <span className="text-green-600">● {stats.green} monitoramento</span>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white border-x border-gray-200 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Tipo:</span>
          <div className="flex gap-1 flex-wrap">
            {disasterTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-2 py-1 rounded-full text-xs transition ${
                  filterType === type.value
                    ? 'bg-[#FFB800] text-black font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-gray-600">Alerta:</span>
          <div className="flex gap-1 flex-wrap">
            {alertLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setFilterAlert(level.value)}
                className={`px-2 py-1 rounded-full text-xs transition ${
                  filterAlert === level.value
                    ? 'bg-[#FFB800] text-black font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAPA */}
      <div className="relative w-full h-[500px] overflow-hidden border border-gray-200 rounded-b-xl">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
          />

          {/* CÍRCULOS E MARCADORES DOS EVENTOS */}
          {filteredEvents.map((event) => {
            if (!event.latitude || !event.longitude) return null
            
            const icon = createIcon(event.type, event.alertLevel, event.magnitude)
            if (!icon) return null
            
            const radius = getCircleRadius(event)
            const color = alertColors[event.alertLevel] || '#888888'
            
            return (
              <div key={event.id}>
                {/* CÍRCULO DE RAIO */}
                <Circle
                  center={[event.latitude, event.longitude]}
                  radius={radius * 1000}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 5'
                  }}
                />
                
                {/* MARCADOR */}
                <Marker
                  position={[event.latitude, event.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px] max-w-[280px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.type}</p>
                        </div>
                      </div>
                      
                      {/* ESCALA DA OCORRÊNCIA - COM MAGNITUDE RICHTER */}
                      <div className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-200">
                        {event.type === 'Terremoto' && event.magnitude ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">Magnitude Richter:</span>
                              <span className="font-bold text-red-600">
                                {event.magnitude.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-500">Classificação:</span>
                              <span className="font-medium text-gray-700">
                                {getMagnitudeRichter(event.magnitude)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-500">Intensidade:</span>
                              <span className="font-medium text-gray-700">
                                {getIntensityLabel(event.magnitude)}
                              </span>
                            </div>
                            {event.depth && (
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-gray-500">Profundidade:</span>
                                <span className="font-medium text-gray-700">{event.depth} km</span>
                              </div>
                            )}
                          </>
                        ) : event.type === 'Ciclone' ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">Categoria:</span>
                              <span className="font-bold text-purple-600">
                                {event.alertLevel === 'red' ? '3+' : 
                                 event.alertLevel === 'orange' ? '2' : '1'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-500">Ventos:</span>
                              <span className="font-medium text-gray-700">
                                {event.alertLevel === 'red' ? '> 200 km/h' : 
                                 event.alertLevel === 'orange' ? '150-200 km/h' : '100-150 km/h'}
                              </span>
                            </div>
                          </>
                        ) : event.type === 'Incêndio' ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">Porte:</span>
                              <span className="font-bold text-orange-600">
                                {event.alertLevel === 'red' ? 'Grande' : 
                                 event.alertLevel === 'orange' ? 'Médio' : 'Pequeno'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-500">Área estimada:</span>
                              <span className="font-medium text-gray-700">
                                {event.alertLevel === 'red' ? '> 100 ha' : 
                                 event.alertLevel === 'orange' ? '50-100 ha' : '< 50 ha'}
                              </span>
                            </div>
                          </>
                        ) : event.type === 'Vulcão' ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">Atividade:</span>
                              <span className="font-bold text-red-600">
                                {event.alertLevel === 'red' ? 'Erupção em andamento' : 
                                 event.alertLevel === 'orange' ? 'Atividade elevada' : 'Monitoramento'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">Severidade:</span>
                              <span className="font-bold text-blue-600">
                                {event.alertLevel === 'red' ? 'Severo' : 
                                 event.alertLevel === 'orange' ? 'Moderado' : 'Leve'}
                              </span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Raio de abrangência:</span>
                          <span className="font-medium text-gray-700">{radius} km</span>
                        </div>
                      </div>
                      
                      {/* STATUS DO ALERTA */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          event.alertLevel === 'red' ? 'bg-red-500' :
                          event.alertLevel === 'orange' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-xs font-medium">
                          {event.alertLevelLabel}
                        </span>
                        {event.alertLevel === 'red' && (
                          <span className="text-[0.55rem] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                            ATENÇÃO
                          </span>
                        )}
                      </div>
                      
                      {event.country && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {event.country}{event.region ? ` - ${event.region}` : ''}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(event.date)}
                      </p>
                      
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-2 border-t border-gray-100 pt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}

          {/* LEGENDA */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs z-10 border border-gray-200">
            <p className="font-semibold text-gray-800 mb-1">Legenda</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600">Crítico</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">Alerta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Monitoramento</span>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <p className="text-[0.55rem] text-gray-400">
                Círculos representam a área de abrangência
              </p>
              <p className="text-[0.55rem] text-gray-400 mt-0.5">
                Marcadores: T=Terremoto, I=Inundação, C=Ciclone, F=Incêndio, V=Vulcão
              </p>
            </div>
          </div>
        </MapContainer>
      </div>
    </div>
  )
}