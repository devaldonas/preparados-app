// app/api/disasters/route.ts
import { NextResponse } from 'next/server';

// 🔥 BUSCAR TERREMOTOS DO USGS (com magnitude)
async function fetchEarthquakesUSGS() {
  try {
    // Busca terremotos das últimas 24h com magnitude > 2.5
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 600 } // 10 minutos
      }
    );

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.features.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      const mag = props.mag || 0;
      
      // Determinar nível de alerta baseado na magnitude
      let alertLevel: 'green' | 'orange' | 'red' = 'green';
      let alertLabel = 'Monitoramento';
      
      if (mag >= 6.0) {
        alertLevel = 'red';
        alertLabel = 'Crítico';
      } else if (mag >= 5.0) {
        alertLevel = 'orange';
        alertLabel = 'Alerta';
      } else if (mag >= 4.0) {
        alertLevel = 'orange';
        alertLabel = 'Alerta';
      } else if (mag >= 3.0) {
        alertLevel = 'green';
        alertLabel = 'Monitoramento';
      }
      
      return {
        id: `usgs-${feature.id}`,
        type: 'Terremoto',
        typeCode: 'EQ',
        title: props.title || 'Terremoto',
        description: props.title || `Magnitude ${mag.toFixed(1)} em ${props.place || 'localização desconhecida'}`,
        latitude: coords[1],
        longitude: coords[0],
        magnitude: mag,
        depth: coords[2] || 0,
        alertLevel: alertLevel,
        alertLevelLabel: alertLabel,
        date: new Date(props.time).toISOString(),
        country: extrairPais(props.place || ''),
        region: props.place || '',
        source: 'USGS'
      };
    });
  } catch (error) {
    console.error('❌ Erro ao buscar terremotos do USGS:', error);
    return [];
  }
}

// 🔥 BUSCAR OUTROS DESASTRES DO GDACS
async function fetchGDACS() {
  try {
    const response = await fetch(
      'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 1800 } // 30 minutos
      }
    );

    if (!response.ok) {
      throw new Error(`GDACS API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.events || [])
      .filter((event: any) => event.eventtype !== 'EQ') // Remove terremotos (vem do USGS)
      .map((event: any) => ({
        id: `gdacs-${event.id || event.eventid || Math.random()}`,
        type: getEventType(event.eventtype || ''),
        typeCode: event.eventtype || '',
        title: event.title || 'Evento GDACS',
        description: event.description || '',
        latitude: parseFloat(event.latitude || event.lat || 0),
        longitude: parseFloat(event.longitude || event.lon || 0),
        magnitude: null,
        depth: parseFloat(event.depth || 0),
        alertLevel: getAlertLevel(event.alertlevel || ''),
        alertLevelLabel: getAlertLevelLabel(event.alertlevel || ''),
        date: event.eventdate || event.date || new Date().toISOString(),
        country: event.country || '',
        region: event.region || '',
        source: 'GDACS'
      }));
  } catch (error) {
    console.error('❌ Erro ao buscar GDACS:', error);
    return [];
  }
}

// 🔥 FUNÇÕES AUXILIARES
function extrairPais(place: string): string {
  // Tenta extrair o país do texto do USGS
  const partes = place.split(',');
  return partes.length > 1 ? partes[partes.length - 1].trim() : '';
}

function getEventType(typeCode: string): string {
  const types: Record<string, string> = {
    'FL': 'Inundação',
    'TC': 'Ciclone',
    'WF': 'Incêndio',
    'VO': 'Vulcão',
    'DR': 'Seca',
    'TS': 'Tsunami'
  };
  return types[typeCode] || 'Desconhecido';
}

function getAlertLevel(level: string): 'green' | 'orange' | 'red' {
  const levels: Record<string, 'green' | 'orange' | 'red'> = {
    'green': 'green',
    'orange': 'orange',
    'red': 'red'
  };
  return levels[level] || 'green';
}

function getAlertLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'green': 'Monitoramento',
    'orange': 'Alerta',
    'red': 'Crítico'
  };
  return labels[level] || 'Monitoramento';
}

// 🔥 ENDPOINT PRINCIPAL
export async function GET() {
  try {
    // Buscar dados das duas fontes em paralelo
    const [earthquakes, otherDisasters] = await Promise.all([
      fetchEarthquakesUSGS(),
      fetchGDACS()
    ]);

    // Combinar todos os eventos
    const allEvents = [...earthquakes, ...otherDisasters];
    
    // Ordenar por data (mais recentes primeiro)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Estatísticas
    const stats = {
      total: allEvents.length,
      red: allEvents.filter((e: any) => e.alertLevel === 'red').length,
      orange: allEvents.filter((e: any) => e.alertLevel === 'orange').length,
      green: allEvents.filter((e: any) => e.alertLevel === 'green').length,
      sources: {
        usgs: earthquakes.length,
        gdacs: otherDisasters.length
      }
    };

    console.log(`📊 Total de eventos: ${stats.total} (USGS: ${stats.sources.usgs}, GDACS: ${stats.sources.gdacs})`);

    return NextResponse.json({
      success: true,
      events: allEvents,
      total: allEvents.length,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados de monitoramento',
      events: []
    }, { status: 500 });
  }
}