import { NextResponse } from 'next/server'

// 🔥 TIPOS DE DESASTRE DO GDACS
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
    // 🔥 URL DA API DO GDACS
    const gdacsUrl = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'
    
    // 🔥 PARÂMETROS: Últimos 30 dias, todos os tipos
    const params = new URLSearchParams({
      searchtype: 'list',
      limit: '100',
      days: '30'
    })

    console.log('📡 [GDACS] Buscando dados do GDACS...')
    console.log('📡 [GDACS] URL:', `${gdacsUrl}?${params.toString()}`)

    const response = await fetch(`${gdacsUrl}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
      }
    })

    if (!response.ok) {
      console.error('❌ [GDACS] Erro na resposta:', response.status, response.statusText)
      throw new Error(`Erro ao buscar dados: ${response.status}`)
    }

    const data = await response.json()
    console.log('📡 [GDACS] Dados recebidos:', data.features?.length || 0, 'eventos')
    console.log('📡 [GDACS] Primeiro evento (exemplo):', JSON.stringify(data.features?.[0], null, 2))

    // 🔥 PROCESSAR OS EVENTOS COM ID ÚNICO
    const events = data.features?.map((feature: any, index: number) => {
      const props = feature.properties || {}
      const geom = feature.geometry || {}
      const coords = geom.coordinates || [0, 0]

      // 🔥 LOG PARA CADA EVENTO
      console.log(`📊 [GDACS] Evento ${index + 1}:`, {
        id: feature.id,
        title: props.title,
        eventtype: props.eventtype,
        magnitude: props.magnitude,
        mag: props.mag,
        alertlevel: props.alertlevel,
        country: props.country,
        latitude: coords[1],
        longitude: coords[0]
      })

      // 🔥 MAPEAR O TIPO DO DESASTRE
      const typeMap: Record<string, string> = {
        'EQ': 'Terremoto',
        'FL': 'Inundação',
        'TC': 'Ciclone',
        'WF': 'Incêndio',
        'VO': 'Vulcão',
        'DR': 'Seca',
        'TS': 'Tsunami'
      }

      // 🔥 NIVEL DE ALERTA
      const alertLevel = props.alertlevel || 'green'

      // 🔥 MAGNITUDE (tenta vários campos)
      const magnitude = props.magnitude || props.mag || null

      // 🔥 PROFUNDIDADE (se disponível)
      const depth = props.depth || props.deep || null

      return {
        id: feature.id || `event-${Date.now()}-${index}`,
        type: typeMap[props.eventtype] || props.eventtype || 'Desconhecido',
        typeCode: props.eventtype || 'UNKNOWN',
        title: props.title || 'Evento',
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
        source: props.source || 'GDACS'
      }
    }) || []

    console.log('✅ [GDACS] Total de eventos processados:', events.length)
    console.log('📊 [GDACS] Eventos por tipo:')
    const typeCount: Record<string, number> = {}
    events.forEach((e: DisasterEvent) => {
      typeCount[e.type] = (typeCount[e.type] || 0) + 1
    })
    console.log('📊 [GDACS]', JSON.stringify(typeCount, null, 2))

    console.log('📊 [GDACS] Eventos por nível de alerta:')
    const alertCount: Record<string, number> = {}
    events.forEach((e: DisasterEvent) => {
      alertCount[e.alertLevel] = (alertCount[e.alertLevel] || 0) + 1
    })
    console.log('📊 [GDACS]', JSON.stringify(alertCount, null, 2))

    return NextResponse.json({
      success: true,
      total: events.length,
      events: events
    })

  } catch (error) {
    console.error('❌ [GDACS] Erro no proxy GDACS:', error)
    
    // 🔥 FALLBACK: DADOS DE EXEMPLO
    console.log('📡 [GDACS] Usando dados de fallback...')
    return NextResponse.json({
      success: true,
      total: 5,
      events: getFallbackEvents()
    })
  }
}

// 🔥 DADOS DE FALLBACK (CASO A API FALHE)
function getFallbackEvents(): DisasterEvent[] {
  return [
    {
      id: 'fallback-1',
      type: 'Terremoto',
      typeCode: 'EQ',
      title: 'Terremoto - Exemplo',
      description: 'Exemplo de terremoto para demonstração. Magnitude 5.5 na escala Richter.',
      latitude: -15.7942,
      longitude: -47.8822,
      magnitude: 5.5,
      depth: 10,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Brasília',
      source: 'Fallback'
    },
    {
      id: 'fallback-2',
      type: 'Inundação',
      typeCode: 'FL',
      title: 'Inundação - Exemplo',
      description: 'Exemplo de inundação para demonstração. Área alagada de grande extensão.',
      latitude: -23.5505,
      longitude: -46.6333,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'São Paulo',
      source: 'Fallback'
    },
    {
      id: 'fallback-3',
      type: 'Ciclone',
      typeCode: 'TC',
      title: 'Ciclone - Exemplo',
      description: 'Exemplo de ciclone para demonstração. Ventos de até 150 km/h.',
      latitude: -22.9068,
      longitude: -43.1729,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'red',
      alertLevelLabel: 'Crítico',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Rio de Janeiro',
      source: 'Fallback'
    },
    {
      id: 'fallback-4',
      type: 'Incêndio',
      typeCode: 'WF',
      title: 'Incêndio - Exemplo',
      description: 'Exemplo de incêndio para demonstração. Queimada de grande proporção.',
      latitude: -19.9245,
      longitude: -43.9352,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'red',
      alertLevelLabel: 'Crítico',
      date: new Date().toISOString(),
      country: 'Brasil',
      region: 'Belo Horizonte',
      source: 'Fallback'
    },
    {
      id: 'fallback-5',
      type: 'Vulcão',
      typeCode: 'VO',
      title: 'Vulcão - Exemplo',
      description: 'Exemplo de vulcão para demonstração. Atividade sísmica elevada.',
      latitude: -0.7893,
      longitude: -91.6424,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'green',
      alertLevelLabel: 'Monitoramento',
      date: new Date().toISOString(),
      country: 'Equador',
      region: 'Galápagos',
      source: 'Fallback'
    }
  ]
}