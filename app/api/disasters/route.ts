import { NextResponse } from 'next/server'

export interface DisasterEvent {
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
  country?: string
  region?: string
  source?: string
}

export async function GET(request: Request) {
  try {
    console.log('📡 [API] Buscando dados de desastres...')
    
    // 🔥 BUSCAR GDACS
    let gdacsEvents: DisasterEvent[] = []
    try {
      const gdacsUrl = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'
      const params = new URLSearchParams({
        searchtype: 'list',
        limit: '100',
        days: '30'
      })

      const gdacsResponse = await fetch(`${gdacsUrl}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
        }
      })

      if (gdacsResponse.ok) {
        const gdacsData = await gdacsResponse.json()
        console.log('📡 [GDACS] Dados recebidos:', gdacsData.features?.length || 0)

        gdacsEvents = gdacsData.features?.map((feature: any, index: number) => {
          const props = feature.properties || {}
          const geom = feature.geometry || {}
          const coords = geom.coordinates || [0, 0]

          const typeMap: Record<string, string> = {
            'EQ': 'Terremoto',
            'FL': 'Inundação',
            'TC': 'Ciclone',
            'WF': 'Incêndio',
            'VO': 'Vulcão',
            'DR': 'Seca',
            'TS': 'Tsunami'
          }

          const alertLevel = props.alertlevel || 'green'
          const magnitude = props.magnitude || props.mag || null
          const depth = props.depth || props.deep || null

          return {
            id: feature.id || `gdacs-${Date.now()}-${index}`,
            type: typeMap[props.eventtype] || props.eventtype || 'Desconhecido',
            typeCode: props.eventtype || 'GDACS',
            title: props.title || 'Evento GDACS',
            description: props.description || props.summary || '',
            latitude: coords[1] || 0,
            longitude: coords[0] || 0,
            magnitude: magnitude,
            depth: depth,
            alertLevel: alertLevel,
            alertLevelLabel: alertLevel === 'red' ? 'Crítico' : alertLevel === 'orange' ? 'Alerta' : 'Monitoramento',
            date: props.eventtime || props.eventdate || new Date().toISOString(),
            country: props.country || 'Desconhecido',
            region: props.region || '',
            source: 'GDACS'
          }
        }) || []
      } else {
        console.warn('⚠️ [GDACS] Falha na requisição, status:', gdacsResponse.status)
      }
    } catch (gdacsError) {
      console.error('❌ [GDACS] Erro:', gdacsError)
    }

    // 🔥 BUSCAR NOAA
    let noaaEvents: DisasterEvent[] = []
    try {
      const noaaResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://preparado.vercel.app'}/api/noaa/alerts`)
      
      if (noaaResponse.ok) {
        const noaaData = await noaaResponse.json()
        if (noaaData.success) {
          noaaEvents = noaaData.events || []
          console.log('📡 [NOAA] Alertas recebidos:', noaaEvents.length)
        }
      } else {
        console.warn('⚠️ [NOAA] Falha na requisição, status:', noaaResponse.status)
      }
    } catch (noaaError) {
      console.error('❌ [NOAA] Erro:', noaaError)
    }

    // 🔥 COMBINAR EVENTOS
    const allEvents = [...gdacsEvents, ...noaaEvents]
    
    console.log('✅ [API] Total de eventos:', allEvents.length)
    console.log('📊 [API] GDACS:', gdacsEvents.length, 'NOAA:', noaaEvents.length)

    // 🔥 ESTATÍSTICAS POR TIPO
    const typeCount: Record<string, number> = {}
    allEvents.forEach((e: DisasterEvent) => {
      typeCount[e.type] = (typeCount[e.type] || 0) + 1
    })
    console.log('📊 [API] Eventos por tipo:', JSON.stringify(typeCount, null, 2))

    return NextResponse.json({
      success: true,
      total: allEvents.length,
      events: allEvents,
      sources: {
        gdacs: gdacsEvents.length,
        noaa: noaaEvents.length
      }
    })

  } catch (error) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados de desastres'
    }, { status: 500 })
  }
}