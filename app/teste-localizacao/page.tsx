'use client'

import { useState } from 'react'

export default function TesteLocalizacao() {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [erro, setErro] = useState('')

  const testarLocalizacao = () => {
    setErro('')
    if (!navigator.geolocation) {
      setErro('Navegador não suporta geolocalização')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toString())
        setLng(position.coords.longitude.toString())
      },
      (err) => {
        setErro('Erro: ' + err.message)
      }
    )
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Teste de Localização</h1>
      <button
        onClick={testarLocalizacao}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Testar Localização
      </button>
      {lat && lng && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>Latitude: {lat}</p>
          <p>Longitude: {lng}</p>
          <p className="text-xs text-gray-500 mt-2">
            Copie esses números para o cadastro manual
          </p>
        </div>
      )}
      {erro && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {erro}
        </div>
      )}
    </div>
  )
}