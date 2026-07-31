import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('📡 [NOAA] Buscando alertas ativos...')

    // 🔥 TENTAR DIFERENTES ENDPOINTS
    const urls = [
      'https://api.weather.gov/alerts/active',
      'https://api.weather.gov/alerts/active?severity=Extreme',
      'https://api.weather.gov/alerts/active?severity=Severe'
    ]

    let data = null
    let usedUrl = ''

    for (const url of urls) {
      try {
        console.log(`📡 [NOAA] Tentando: ${url}`)
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PREPARADO App (https://preparado.vercel.app)'
          }
        })

        if (response.ok) {
          data = await response.json()
          usedUrl = url
          console.log(`✅ [NOAA] Sucesso com: ${url}`)
          break
        }
      } catch (e) {
        console.warn(`⚠️ [NOAA] Falha na URL: ${url}`, e)
      }
    }

    if (!data || !data.features) {
      console.log('⚠️ [NOAA] Nenhum alerta encontrado')
      return NextResponse.json({
        success: true,
        total: 0,
        events: [],
        source: 'NOAA',
        message: 'Nenhum alerta ativo no momento'
      })
    }

    console.log('📡 [NOAA] Alertas recebidos:', data.features?.length || 0)

    // 🔥 PROCESSAR ALERTAS
    const alerts = data.features?.map((feature: any, index: number) => {
      const props = feature.properties || {}
      const geom = feature.geometry || {}
      
      let latitude = 0
      let longitude = 0
      
      if (geom.type === 'Polygon' && geom.coordinates?.length > 0) {
        const coords = geom.coordinates[0]
        if (coords.length > 0) {
          const center = coords.reduce((acc: [number, number], curr: [number, number]) => {
            return [acc[0] + curr[0], acc[1] + curr[1]]
          }, [0, 0])
          longitude = center[0] / coords.length
          latitude = center[1] / coords.length
        }
      } else if (geom.type === 'Point') {
        longitude = geom.coordinates?.[0] || 0
        latitude = geom.coordinates?.[1] || 0
      }

      // 🔥 SÓ INCLUIR ALERTAS COM COORDENADAS VÁLIDAS
      if (latitude === 0 && longitude === 0) {
        console.log('⚠️ [NOAA] Alerta sem coordenadas:', props.id)
        return null
      }

      const severityMap: Record<string, string> = {
        'Extreme': 'red',
        'Severe': 'orange',
        'Moderate': 'orange',
        'Minor': 'green',
        'Unknown': 'green'
      }

      const alertLevel = severityMap[props.severity] || 'green'

      const typeMap: Record<string, string> = {
        'Tornado': 'Ciclone',
        'Hurricane': 'Ciclone',
        'Typhoon': 'Ciclone',
        'Severe Thunderstorm': 'Tempestade',
        'Flash Flood': 'Inundação',
        'Flood': 'Inundação',
        'Fire Weather': 'Incêndio',
        'Red Flag Warning': 'Incêndio',
        'Winter Storm': 'Tempestade',
        'Blizzard': 'Tempestade',
        'Coastal Flood': 'Inundação',
        'Storm Surge': 'Inundação',
        'Tsunami': 'Tsunami',
        'Volcano': 'Vulcão'
      }

      const eventType = typeMap[props.event] || props.event || 'Alerta Climático'

      return {
        id: props.id || `noaa-${Date.now()}-${index}`,
        type: eventType,
        typeCode: 'NOAA',
        title: props.headline || props.event || 'Alerta NOAA',
        description: props.description || props.summary || '',
        latitude: latitude,
        longitude: longitude,
        magnitude: undefined,
        depth: undefined,
        alertLevel: alertLevel,
        alertLevelLabel: props.severity || 'Monitoramento',
        date: props.sent || new Date().toISOString(),
        country: 'EUA',
        region: props.areaDesc || '',
        source: 'NOAA'
      }
    }).filter(Boolean) || []

    console.log('✅ [NOAA] Alertas processados:', alerts.length)

    return NextResponse.json({
      success: true,
      total: alerts.length,
      events: alerts,
      source: 'NOAA'
    })

  } catch (error) {
    console.error('❌ [NOAA] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados da NOAA'
    }, { status: 500 })
  }
}
// 🔥 DADOS DE EXEMPLO PARA TESTE (se a API falhar)
function getFallbackAlerts(): any[] {
  return [
    {
      id: 'noaa-fallback-1',
      type: 'Ciclone',
      typeCode: 'NOAA',
      title: 'Furacão - Exemplo NOAA',
      description: 'Exemplo de alerta de furacão para demonstração da integração com a NOAA.',
      latitude: 25.7617,
      longitude: -80.1918,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'red',
      alertLevelLabel: 'Crítico',
      date: new Date().toISOString(),
      country: 'EUA',
      region: 'Flórida',
      source: 'NOAA'
    },
    {
      id: 'noaa-fallback-2',
      type: 'Tempestade',
      typeCode: 'NOAA',
      title: 'Tempestade Severa - Exemplo NOAA',
      description: 'Exemplo de alerta de tempestade severa para demonstração.',
      latitude: 30.2672,
      longitude: -97.7431,
      magnitude: undefined,
      depth: undefined,
      alertLevel: 'orange',
      alertLevelLabel: 'Alerta',
      date: new Date().toISOString(),
      country: 'EUA',
      region: 'Texas',
      source: 'NOAA'
    }
  ]
}