// app/api/disasters/route.ts
import { NextResponse } from 'next/server'

export interface DisasterEvent {
  id: string
  type: string
  typeCode: string
  title: string
  description: string
  latitude: number
  longitude: number
  magnitude?: number | null
  depth?: number | null
  alertLevel: 'green' | 'orange' | 'red'
  alertLevelLabel: string
  date: string
  country?: string
  region?: string
  source?: string
}

// 🔥 BUSCAR TERREMOTOS DO USGS
async function fetchEarthquakesUSGS(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [USGS] Buscando terremotos...')
    
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
        }
      }
    )

    if (!response.ok) {
      console.warn('⚠️ [USGS] Falha na requisição, status:', response.status)
      return []
    }

    const data = await response.json()
    console.log('📡 [USGS] Terremotos encontrados:', data.features?.length || 0)

    if (!data.features || data.features.length === 0) {
      return []
    }

    return data.features.map((feature: any) => {
      const props = feature.properties || {}
      const coords = feature.geometry?.coordinates || [0, 0, 0]
      const mag = props.mag || 0
      
      let alertLevel: 'green' | 'orange' | 'red' = 'green'
      let alertLabel = 'Monitoramento'
      
      if (mag >= 6.0) {
        alertLevel = 'red'
        alertLabel = 'Crítico'
      } else if (mag >= 4.5) {
        alertLevel = 'orange'
        alertLabel = 'Alerta'
      }
      
      return {
        id: `usgs-${feature.id}`,
        type: 'Terremoto',
        typeCode: 'EQ',
        title: props.title || `Magnitude ${mag.toFixed(1)} em ${props.place || 'localização desconhecida'}`,
        description: props.title || `Magnitude ${mag.toFixed(1)} - ${props.place || 'Localização desconhecida'}`,
        latitude: coords[1] || 0,
        longitude: coords[0] || 0,
        magnitude: mag,
        depth: coords[2] || null,
        alertLevel: alertLevel,
        alertLevelLabel: alertLabel,
        date: new Date(props.time || Date.now()).toISOString(),
        country: extrairPais(props.place || ''),
        region: props.place || '',
        source: 'USGS'
      }
    })
  } catch (error) {
    console.error('❌ [USGS] Erro:', error)
    return []
  }
}

// 🔥 BUSCAR GDACS - VERSÃO CORRIGIDA
async function fetchGDACS(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [GDACS] Buscando desastres...')
    
    // Usar URL diferente e mais simples
    const url = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
      }
    })

    if (!response.ok) {
      console.warn('⚠️ [GDACS] Falha na requisição, status:', response.status)
      // Retornar dados mockados
      return getMockGDACSEvents()
    }

    const data = await response.json()
    console.log('📡 [GDACS] Resposta recebida, keys:', Object.keys(data))
    
    // Tentar encontrar os eventos em diferentes estruturas
    let events: any[] = []
    if (data.events && Array.isArray(data.events)) {
      events = data.events
    } else if (data.features && Array.isArray(data.features)) {
      events = data.features
    } else if (data.data && Array.isArray(data.data)) {
      events = data.data
    } else if (Array.isArray(data)) {
      events = data
    } else {
      // Procurar por qualquer array nos dados
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          events = data[key]
          console.log(`📡 [GDACS] Encontrado array em: ${key}`)
          break
        }
      }
    }

    console.log('📡 [GDACS] Eventos brutos:', events.length)

    if (events.length === 0) {
      console.warn('⚠️ [GDACS] Nenhum evento encontrado, usando mock')
      return getMockGDACSEvents()
    }

    // Mapear eventos
    const mappedEvents: DisasterEvent[] = events.map((event: any, index: number) => {
      // Tentar diferentes estruturas
      const props = event.properties || event
      const geom = event.geometry || event
      
      const typeCode = props.eventtype || props.type || event.type || 'UNKNOWN'
      const eventType = getEventType(typeCode)
      
      // Extrair coordenadas
      let lat = 0, lon = 0
      if (geom.coordinates && Array.isArray(geom.coordinates)) {
        lon = geom.coordinates[0] || 0
        lat = geom.coordinates[1] || 0
      } else {
        lat = parseFloat(props.latitude || props.lat || event.latitude || 0)
        lon = parseFloat(props.longitude || props.lon || event.longitude || 0)
      }

      const magnitude = props.magnitude || props.mag || null
      const depth = props.depth || props.deep || null
      const alertLevel = props.alertlevel || props.alertLevel || 'green'
      
      return {
        id: event.id || props.id || `gdacs-${Date.now()}-${index}`,
        type: eventType,
        typeCode: typeCode,
        title: props.title || props.name || 'Evento GDACS',
        description: props.description || props.summary || '',
        latitude: lat,
        longitude: lon,
        magnitude: magnitude ? parseFloat(magnitude) : null,
        depth: depth ? parseFloat(depth) : null,
        alertLevel: alertLevel === 'red' ? 'red' : alertLevel === 'orange' ? 'orange' : 'green',
        alertLevelLabel: alertLevel === 'red' ? 'Crítico' : alertLevel === 'orange' ? 'Alerta' : 'Monitoramento',
        date: props.eventdate || props.eventtime || props.date || new Date().toISOString(),
        country: props.country || 'Desconhecido',
        region: props.region || '',
        source: 'GDACS'
      }
    })

    // Filtrar eventos com coordenadas válidas
    const validEvents: DisasterEvent[] = mappedEvents.filter((e: DisasterEvent) => 
      e.latitude !== 0 && e.longitude !== 0 && 
      e.latitude >= -90 && e.latitude <= 90 &&
      e.longitude >= -180 && e.longitude <= 180
    )

    console.log('📡 [GDACS] Eventos válidos:', validEvents.length)

    if (validEvents.length === 0) {
      return getMockGDACSEvents()
    }

    return validEvents

  } catch (error) {
    console.error('❌ [GDACS] Erro:', error)
    return getMockGDACSEvents()
  }
}

// 🔥 DADOS MOCKADOS PARA GDACS
function getMockGDACSEvents(): DisasterEvent[] {
  console.log('📡 [GDACS] Usando dados mockados')
  return [
    {
      id: 'mock-flood-1',
      type: 'Inundação',
      typeCode: 'FL',
      title: 'Inundação na Região Sul',
      description: 'Inundação severa afetando áreas ribeirinhas',
      latitude: -28.23,
      longitude: -52.40,
      magnitude: null,
      depth: null,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Rio Grande do Sul',
      source: 'MOCK'
    },
    {
      id: 'mock-cyclone-1',
      type: 'Ciclone',
      typeCode: 'TC',
      title: 'Ciclone no Atlântico Sul',
      description: 'Ciclone se formando na costa brasileira',
      latitude: -25.90,
      longitude: -42.50,
      magnitude: null,
      depth: null,
      alertLevel: 'red',
      alertLevelLabel: 'Crítico',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Oceano Atlântico',
      source: 'MOCK'
    },
    {
      id: 'mock-fire-1',
      type: 'Incêndio',
      typeCode: 'WF',
      title: 'Incêndio na Amazônia',
      description: 'Incêndio florestal em área preservada',
      latitude: -8.52,
      longitude: -62.80,
      magnitude: null,
      depth: null,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Amazonas',
      source: 'MOCK'
    },
    {
      id: 'mock-volcano-1',
      type: 'Vulcão',
      typeCode: 'VO',
      title: 'Atividade Vulcânica - Cotopaxi',
      description: 'Vulcão Cotopaxi apresentando atividade',
      latitude: -0.38,
      longitude: -78.43,
      magnitude: null,
      depth: null,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Equador',
      region: 'Cotopaxi',
      source: 'MOCK'
    },
    {
      id: 'mock-drought-1',
      type: 'Seca',
      typeCode: 'DR',
      title: 'Seca no Nordeste',
      description: 'Estiagem severa na região semiárida',
      latitude: -8.76,
      longitude: -40.48,
      magnitude: null,
      depth: null,
      alertLevel: 'green',
      alertLevelLabel: 'Monitoramento',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Pernambuco',
      source: 'MOCK'
    },
    {
      id: 'mock-flood-2',
      type: 'Inundação',
      typeCode: 'FL',
      title: 'Inundação na Europa',
      description: 'Inundações na Alemanha e países vizinhos',
      latitude: 50.45,
      longitude: 12.30,
      magnitude: null,
      depth: null,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Alemanha',
      region: 'Europa Central',
      source: 'MOCK'
    },
    {
      id: 'mock-fire-2',
      type: 'Incêndio',
      typeCode: 'WF',
      title: 'Incêndio na Califórnia',
      description: 'Incêndios florestais na costa oeste dos EUA',
      latitude: 34.05,
      longitude: -118.24,
      magnitude: null,
      depth: null,
      alertLevel: 'red',
      alertLevelLabel: 'Crítico',
      date: new Date().toISOString(),
      country: 'EUA',
      region: 'Califórnia',
      source: 'MOCK'
    },
    {
      id: 'mock-cyclone-2',
      type: 'Ciclone',
      typeCode: 'TC',
      title: 'Ciclone no Pacífico',
      description: 'Ciclone tropical se aproximando do Japão',
      latitude: 25.0,
      longitude: 135.0,
      magnitude: null,
      depth: null,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Japão',
      region: 'Pacífico',
      source: 'MOCK'
    }
  ]
}

// 🔥 BUSCAR NOAA
async function fetchNOAA(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [NOAA] Buscando alertas...')
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${appUrl}/api/noaa/alerts`, {
      next: { revalidate: 600 }
    })
    
    if (!response.ok) {
      console.warn('⚠️ [NOAA] Falha na requisição, status:', response.status)
      return []
    }
    
    const data = await response.json()
    if (data.success) {
      console.log('📡 [NOAA] Alertas encontrados:', data.events?.length || 0)
      return data.events || []
    }
    return []
  } catch (error) {
    console.error('❌ [NOAA] Erro:', error)
    return []
  }
}

// 🔥 FUNÇÕES AUXILIARES
function getEventType(typeCode: string): string {
  const types: Record<string, string> = {
    'EQ': 'Terremoto',
    'FL': 'Inundação',
    'TC': 'Ciclone',
    'WF': 'Incêndio',
    'VO': 'Vulcão',
    'DR': 'Seca',
    'TS': 'Tsunami',
    'UNKNOWN': 'Desconhecido'
  }
  return types[typeCode] || types[typeCode.toUpperCase()] || 'Desconhecido'
}

function extrairPais(place: string): string {
  if (!place) return 'Desconhecido'
  const partes = place.split(',')
  return partes.length > 1 ? partes[partes.length - 1].trim() : place.trim()
}

// 🔥 ENDPOINT PRINCIPAL
export async function GET() {
  try {
    console.log('📡 [API] Iniciando busca de dados...')
    
    // 🔥 BUSCAR AS TRÊS FONTES EM PARALELO
    const [earthquakes, gdacsEvents, noaaEvents] = await Promise.all([
      fetchEarthquakesUSGS(),
      fetchGDACS(),
      fetchNOAA()
    ])

    console.log('📊 [API] Resultados:')
    console.log('  - USGS (terremotos):', earthquakes.length)
    console.log('  - GDACS (desastres):', gdacsEvents.length)
    console.log('  - NOAA (alertas):', noaaEvents.length)

    // 🔥 COMBINAR TODOS OS EVENTOS
    const allEvents: DisasterEvent[] = [...earthquakes, ...gdacsEvents, ...noaaEvents]
    
    // Ordenar por data (mais recentes primeiro)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 🔥 ESTATÍSTICAS
    const stats = {
      total: allEvents.length,
      red: allEvents.filter((e: DisasterEvent) => e.alertLevel === 'red').length,
      orange: allEvents.filter((e: DisasterEvent) => e.alertLevel === 'orange').length,
      green: allEvents.filter((e: DisasterEvent) => e.alertLevel === 'green').length,
      sources: {
        usgs: earthquakes.length,
        gdacs: gdacsEvents.length,
        noaa: noaaEvents.length
      }
    }

    // 🔥 ESTATÍSTICAS POR TIPO
    const typeCount: Record<string, number> = {}
    allEvents.forEach((e: DisasterEvent) => {
      typeCount[e.type] = (typeCount[e.type] || 0) + 1
    })

    console.log('✅ [API] Total de eventos:', allEvents.length)
    console.log('📊 [API] Fontes:', stats.sources)
    console.log('📊 [API] Tipos:', JSON.stringify(typeCount, null, 2))
    console.log('📊 [API] Alertas:', `🔴${stats.red} 🟠${stats.orange} 🟢${stats.green}`)

    return NextResponse.json({
      success: true,
      total: allEvents.length,
      events: allEvents,
      stats: stats,
      typeCount: typeCount
    })

  } catch (error) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados de desastres',
      events: []
    }, { status: 500 })
  }
}