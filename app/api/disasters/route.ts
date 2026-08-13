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

// 🔥 BUSCAR TERREMOTOS DO USGS (com magnitude real)
async function fetchEarthquakesUSGS(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [USGS] Buscando terremotos...')
    
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
        },
        next: { revalidate: 600 } // 10 minutos
      }
    )

    if (!response.ok) {
      console.warn('⚠️ [USGS] Falha na requisição, status:', response.status)
      return []
    }

    const data = await response.json()
    console.log('📡 [USGS] Terremotos encontrados:', data.features?.length || 0)

    return data.features?.map((feature: any) => {
      const props = feature.properties || {}
      const coords = feature.geometry?.coordinates || [0, 0, 0]
      const mag = props.mag || 0
      
      // Determinar nível de alerta baseado na magnitude
      let alertLevel: 'green' | 'orange' | 'red' = 'green'
      let alertLabel = 'Monitoramento'
      
      if (mag >= 6.0) {
        alertLevel = 'red'
        alertLabel = 'Crítico'
      } else if (mag >= 4.5) {
        alertLevel = 'orange'
        alertLabel = 'Alerta'
      } else if (mag >= 2.5) {
        alertLevel = 'green'
        alertLabel = 'Monitoramento'
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
    }) || []
  } catch (error) {
    console.error('❌ [USGS] Erro:', error)
    return []
  }
}

// 🔥 BUSCAR GDACS (todos os desastres exceto terremotos)
async function fetchGDACS(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [GDACS] Buscando desastres...')
    
    const params = new URLSearchParams({
      searchtype: 'list',
      limit: '100',
      days: '30'
    })

    const response = await fetch(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
        },
        next: { revalidate: 1800 } // 30 minutos
      }
    )

    if (!response.ok) {
      console.warn('⚠️ [GDACS] Falha na requisição, status:', response.status)
      return []
    }

    const data = await response.json()
    console.log('📡 [GDACS] Desastres encontrados:', data.events?.length || 0)

    const events = data.events || []
    
    return events
      .filter((event: any) => event.eventtype !== 'EQ') // Remove terremotos (vem do USGS)
      .map((event: any, index: number) => {
        const typeMap: Record<string, string> = {
          'FL': 'Inundação',
          'TC': 'Ciclone',
          'WF': 'Incêndio',
          'VO': 'Vulcão',
          'DR': 'Seca',
          'TS': 'Tsunami'
        }

        const alertLevel = event.alertlevel || 'green'
        const magnitude = event.magnitude || event.mag || null
        const depth = event.depth || event.deep || null

        return {
          id: event.id || `gdacs-${Date.now()}-${index}`,
          type: typeMap[event.eventtype] || event.eventtype || 'Desconhecido',
          typeCode: event.eventtype || 'GDACS',
          title: event.title || 'Evento GDACS',
          description: event.description || event.summary || '',
          latitude: parseFloat(event.latitude || event.lat || 0),
          longitude: parseFloat(event.longitude || event.lon || 0),
          magnitude: magnitude,
          depth: depth,
          alertLevel: alertLevel === 'red' ? 'red' : alertLevel === 'orange' ? 'orange' : 'green',
          alertLevelLabel: alertLevel === 'red' ? 'Crítico' : alertLevel === 'orange' ? 'Alerta' : 'Monitoramento',
          date: event.eventdate || event.eventtime || new Date().toISOString(),
          country: event.country || 'Desconhecido',
          region: event.region || '',
          source: 'GDACS'
        }
      })
  } catch (error) {
    console.error('❌ [GDACS] Erro:', error)
    return []
  }
}

// 🔥 BUSCAR NOAA
async function fetchNOAA(): Promise<DisasterEvent[]> {
  try {
    console.log('📡 [NOAA] Buscando alertas...')
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'
    const response = await fetch(`${appUrl}/api/noaa/alerts`, {
      next: { revalidate: 600 } // 10 minutos
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
function extrairPais(place: string): string {
  if (!place) return 'Desconhecido'
  const partes = place.split(',')
  return partes.length > 1 ? partes[partes.length - 1].trim() : place.trim()
}

export async function GET() {
  try {
    console.log('📡 [API] Iniciando busca de dados...')
    
    // 🔥 BUSCAR AS TRÊS FONTES EM PARALELO
    const [earthquakes, gdacsEvents, noaaEvents] = await Promise.all([
      fetchEarthquakesUSGS(),
      fetchGDACS(),
      fetchNOAA()
    ])

    // 🔥 COMBINAR TODOS OS EVENTOS
    const allEvents = [...earthquakes, ...gdacsEvents, ...noaaEvents]
    
    // Ordenar por data (mais recentes primeiro)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 🔥 ESTATÍSTICAS
    const stats = {
      total: allEvents.length,
      red: allEvents.filter((e) => e.alertLevel === 'red').length,
      orange: allEvents.filter((e) => e.alertLevel === 'orange').length,
      green: allEvents.filter((e) => e.alertLevel === 'green').length,
      sources: {
        usgs: earthquakes.length,
        gdacs: gdacsEvents.length,
        noaa: noaaEvents.length
      }
    }

    // 🔥 ESTATÍSTICAS POR TIPO
    const typeCount: Record<string, number> = {}
    allEvents.forEach((e) => {
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