'use client';

interface WindyEmbedProps {
  /** Camada: 'temp' (temperatura), 'wind' (vento), 'rain' (chuva), 'clouds' (nuvens), 'pressure' (pressão) */
  overlay?: 'temp' | 'wind' | 'rain' | 'clouds' | 'pressure';
  /** Latitude central */
  lat?: number;
  /** Longitude central */
  lon?: number;
  /** Zoom (1-18) */
  zoom?: number;
  /** Altura do container (classes Tailwind). Default: h-full */
  heightClass?: string;
}

export default function WindyEmbed({
  overlay = 'temp',
  lat = -15.961,
  lon = -56.514,
  zoom = 4,
  heightClass = 'h-full',
}: WindyEmbedProps) {
  const params = new URLSearchParams({
    type: 'map',
    location: 'coordinates',
    metricRain: 'mm',
    metricTemp: '°C',
    metricWind: 'km/h',
    zoom: String(zoom),
    overlay,
    product: 'ecmwf',
    level: 'surface',
    lat: String(lat),
    lon: String(lon),
    detailLat: String(lat),
    detailLon: String(lon),
    marker: 'true',
    message: 'true',
  });

  const url = `https://embed.windy.com/embed.html?${params.toString()}`;

  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-gray-200 bg-gray-50`}>
      <iframe
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Mapa Windy"
        loading="lazy"
      />
    </div>
  );
}
