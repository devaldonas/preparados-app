'use client'

import { useEffect, useState, useRef } from 'react'

interface Evento {
  id: string
  magnitude: number
  lugar: string
  data: string
  url: string
  lat: number
  lng: number
}

export default function MapaMonitoramentoCompleto() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')
  const [erro, setErro] = useState('')
  const [mapaCarregado, setMapaCarregado] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapaInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const buscarEventos = async () => {
    try {
      setCarregando(true)
      const response = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
      )
      const data = await response.json()

      const eventosFormatados = data.features.map((feature: any) => ({
        id: feature.id,
        magnitude: feature.properties.mag,
        lugar: feature.properties.place,
        data: new Date(feature.properties.time).toLocaleString(),
        url: feature.properties.url,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      }))

      setEventos(eventosFormatados)
      setUltimaAtualizacao(new Date().toLocaleTimeString())
      setErro('')
      
      if (mapaInstanceRef.current) {
        atualizarMarcadores(eventosFormatados)
      }
    } catch (error) {
      console.error('Erro ao buscar terremotos:', error)
      setErro('Não foi possível carregar os dados')
    } finally {
      setCarregando(false)
    }
  }

  const carregarMapa = () => {
    if (mapaCarregado || typeof window === 'undefined') return

    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      if (!mapRef.current || mapaInstanceRef.current) return

      const map = L.map(mapRef.current).setView([20, 0], 2)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      mapaInstanceRef.current = map
      setMapaCarregado(true)
      
      if (eventos.length > 0) {
        atualizarMarcadores(eventos)
      }
    }).catch(err => {
      console.error('Erro ao carregar Leaflet:', err)
      setErro('Erro ao carregar o mapa')
    })
  }

  const atualizarMarcadores = (eventosLista: Evento[]) => {
    if (!mapaInstanceRef.current) return

    markersRef.current.forEach(marker => {
      marker.remove()
    })
    markersRef.current = []

    const L = (window as any).L
    if (!L) return

    eventosLista.forEach(evento => {
      const cor = evento.magnitude >= 5 ? '#c0392b' : (evento.magnitude >= 4 ? '#e67e22' : '#3498db')
      const tamanho = evento.magnitude >= 5 ? 12 : 8
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${cor}; width:${tamanho}px; height:${tamanho}px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [tamanho, tamanho],
        iconAnchor: [tamanho/2, tamanho/2]
      })

      const marker = L.marker([evento.lat, evento.lng], { icon })
        .bindPopup(`
          <strong>Terremoto Magnitude ${evento.magnitude}</strong><br>
          ${evento.lugar}<br>
          ${evento.data}<br>
          <a href="${evento.url}" target="_blank" rel="noopener noreferrer">Ver no USGS →</a>
        `)
        .addTo(mapaInstanceRef.current)
      
      markersRef.current.push(marker)
    })
  }

  useEffect(() => {
    buscarEventos()
    const interval = setInterval(buscarEventos, 300000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    carregarMapa()
  }, [])

  const getSeveridadeClass = (mag: number) => {
    if (mag >= 5) return 'text-red-600 font-bold'
    if (mag >= 4) return 'text-orange-500 font-bold'
    return 'text-blue-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <h3 className="font-semibold text-gray-900">Monitoramento Global - Terremotos</h3>
              <p className="text-xs text-gray-500">
                Últimas 24h (Magnitude ≥ 2.5) | Fonte: USGS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {ultimaAtualizacao && `Atualizado: ${ultimaAtualizacao}`}
            </span>
            <button
              onClick={buscarEventos}
              disabled={carregando}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition disabled:opacity-50"
            >
              {carregando ? '⏳' : '🔄'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 h-[400px] lg:h-[500px] relative">
          <div ref={mapRef} className="w-full h-full" />
          {!mapaCarregado && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="p-3 bg-gray-100 border-b border-gray-200">
            <h4 className="font-semibold text-gray-700 text-sm">📋 Eventos Recentes</h4>
            <p className="text-xs text-gray-400">{eventos.length} terremotos nas últimas 24h</p>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-[450px]">
            {carregando && eventos.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Carregando eventos...</div>
            ) : erro ? (
              <div className="p-4 text-center text-red-500 text-sm">{erro}</div>
            ) : eventos.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum evento significativo detectado.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {eventos.slice(0, 30).map((evento) => (
                  <div key={evento.id} className="p-3 hover:bg-white transition">
                    <div className={`text-sm ${getSeveridadeClass(evento.magnitude)}`}>
                      Terremoto M {evento.magnitude}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 truncate" title={evento.lugar}>
                      {evento.lugar}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {evento.data}
                    </div>
                    <a
                      href={evento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      Mais detalhes →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span>Magnitude ≥ 5 (Alto)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Magnitude 4 - 4.9 (Médio)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Magnitude 2.5 - 3.9 (Baixo)</span>
        </div>
      </div>
    </div>
  )
}