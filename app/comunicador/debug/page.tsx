'use client'

export default function DebugComunicador() {
  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Debug - Comunicador</h1>
      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Arquivo SVG:</h2>
        <p className="text-sm text-gray-400">
          Verifique se o arquivo existe em:
          <br />
          <code className="text-[#FFB800]">/public/images/comunicador/radio-interface.svg</code>
        </p>
        <a 
          href="/images/comunicador/radio-interface.svg" 
          target="_blank" 
          className="inline-block mt-4 bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E5A600] transition"
        >
          Abrir SVG diretamente
        </a>
      </div>
      <div className="mt-4 bg-gray-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">IDs que devem existir no SVG:</h2>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>✓ <code className="text-[#FFB800]">botao-onoff</code></li>
          <li>✓ <code className="text-[#FFB800]">botao-ptt</code></li>
          <li>✓ <code className="text-[#FFB800]">botao-canais-grupos</code></li>
          <li>✓ <code className="text-[#FFB800]">slider-range</code></li>
          <li>✓ <code className="text-[#FFB800]">slider-volume</code></li>
          <li>✓ <code className="text-[#FFB800]">titulo-canal</code></li>
          <li>✓ <code className="text-[#FFB800]">container-grupos-canal</code></li>
        </ul>
      </div>
    </div>
  )
}