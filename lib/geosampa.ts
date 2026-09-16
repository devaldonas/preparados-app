// lib/geosampa.ts
//
// Cliente para o WFS do GeoSampa (Prefeitura de São Paulo).
// Fonte: http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs
//
// ⚠️ Os dados de alagamento são ATUALIZADOS MENSALMENTE.
// Não são tempo real — são histórico/áreas de risco.

const GEOSAMPA_WFS_URL = 'http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs'

// 🔥 Camadas disponíveis (as mais úteis para desastres)
export const GEOSAMPA_LAYERS = {
  alagamento: 'geoportal:risco_ocorrencia_alagamento',
  inundacao: 'geoportal:risco_ocorrencia_inundacao',
  deslizamento: 'geoportal:risco_ocorrencia_deslizamento',
  quedaArvore: 'geoportal:risco_ocorrencia_queda_arvore',
  manchaInundacao100: 'geoportal:mancha_inundacao_100',
  manchaInundacao25: 'geoportal:mancha_inundacao_25',
  manchaInundacao5: 'geoportal:mancha_inundacao_5',
  riscoHidrologico: 'geoportal:risco_hidrologico',
  riscoGeologico: 'geoportal:area_risco_geologico',
  comdec: 'geoportal:unidade_comdec',
  pluviometro: 'geoportal:pluviometro',
} as const

export type GeoSampaLayer = keyof typeof GEOSAMPA_LAYERS

// 🔥 Interface dos dados de alagamento/inundação
export interface GeoSampaRiscoProperties {
  cd_identificador: string
  dt_ocorrencia: string       // formato "2026-04-01Z"
  dc_tipo_ocorrencia: string  // "ALAGAMENTO" | "INUNDACAO" | etc
  nm_distrito: string | null
  dt_carga: string            // data da última carga
  nm_subprefeitura: string
  sg_fonte_original: string   // "SIGRC" (Defesa Civil)
}

export interface GeoSampaFeature {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
  properties: GeoSampaRiscoProperties | Record<string, any>
}

export interface GeoSampaResponse {
  type: 'FeatureCollection'
  features: GeoSampaFeature[]
  totalFeatures: number
  numberMatched: number
  numberReturned: number
  timeStamp: string
  crs: {
    type: 'name'
    properties: { name: string }
  }
}

interface FetchOptions {
  /** Limite de registros (default: 200) */
  count?: number
  /** Filtro CQL opcional (ex: `dt_ocorrencia > '2026-01-01'`) */
  cqlFilter?: string
  /** Bounding box opcional [minLon, minLat, maxLon, maxLat] */
  bbox?: [number, number, number, number]
}

/**
 * Busca features de uma camada do GeoSampa.
 * ⚠️ Sempre retorna em EPSG:4326 (lat/lng) para o Leaflet.
 */
export async function fetchGeoSampaLayer(
  layer: GeoSampaLayer,
  options: FetchOptions = {}
): Promise<GeoSampaFeature[]> {
  const { count = 200, cqlFilter, bbox } = options

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: GEOSAMPA_LAYERS[layer],
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    count: String(count),
  })

  if (cqlFilter) {
    params.set('CQL_FILTER', cqlFilter)
  }

  if (bbox) {
    params.set('bbox', bbox.join(','))
  }

  const url = `${GEOSAMPA_WFS_URL}?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      // ⚠️ Cache de 1h — os dados são atualizados mensalmente
      next: { revalidate: 3600 },
    } as RequestInit)

    if (!response.ok) {
      throw new Error(`GeoSampa WFS error: ${response.status}`)
    }

    const data: GeoSampaResponse = await response.json()
    return data.features || []
  } catch (error) {
    console.error(`❌ Erro ao buscar ${layer} do GeoSampa:`, error)
    return []
  }
}

/**
 * Busca apenas os alagamentos (mais comum).
 */
export async function fetchAlagamentos(options: FetchOptions = {}) {
  return fetchGeoSampaLayer('alagamento', options)
}

/**
 * Busca alagamentos recentes (últimos N meses).
 */
export async function fetchAlagamentosRecentes(meses = 3) {
  const dataLimite = new Date()
  dataLimite.setMonth(dataLimite.getMonth() - meses)
  const dataFormatada = dataLimite.toISOString().split('T')[0] // YYYY-MM-DD

  return fetchGeoSampaLayer('alagamento', {
    cqlFilter: `dt_ocorrencia > '${dataFormatada}'`,
    count: 500,
  })
}
