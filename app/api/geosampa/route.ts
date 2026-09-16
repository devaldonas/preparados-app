// app/api/geosampa/route.ts
//
// API interna que consome o WFS do GeoSampa e devolve os dados
// no formato já pronto para o frontend.
//
// Vantagens:
// - Cache de 1h (evita bater no WFS a cada request)
// - Padroniza o formato de saída
// - Esconde a URL do GeoSampa do frontend

import { NextResponse } from 'next/server'
import {
  fetchGeoSampaLayer,
  fetchAlagamentosRecentes,
  GeoSampaLayer,
} from '@/lib/geosampa'

export const revalidate = 3600 // Cache de 1h

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const layer = (searchParams.get('layer') || 'alagamento') as GeoSampaLayer
  const recentes = searchParams.get('recentes') === 'true'
  const count = parseInt(searchParams.get('count') || '500')

  try {
    let features

    if (layer === 'alagamento' && recentes) {
      features = await fetchAlagamentosRecentes(3)
    } else {
      features = await fetchGeoSampaLayer(layer, { count })
    }

    // 🔥 Normaliza os dados para o frontend
    const normalized = features.map((f) => ({
      id: f.id,
      lat: f.geometry.type === 'Point' ? f.geometry.coordinates[1] : null,
      lng: f.geometry.type === 'Point' ? f.geometry.coordinates[0] : null,
      geometry: f.geometry, // preserva a geometria completa (para polígonos)
      properties: f.properties,
    }))

    return NextResponse.json({
      success: true,
      layer,
      total: normalized.length,
      features: normalized,
    })
  } catch (error) {
    console.error('❌ Erro na API GeoSampa:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
