'use client'

import { useState } from 'react'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'

export default function RotasFuga() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const imagens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const totalImagens = imagens.length

  const irParaAnterior = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImagens - 1 : prev - 1))
  }

  const irParaProxima = () => {
    setCurrentIndex((prev) => (prev === totalImagens - 1 ? 0 : prev + 1))
  }

  const irParaImagem = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>

          <h1 className="text-2xl font-bold text-black mb-2 text-center">Rotas de Fuga</h1>
          <p className="text-gray-500 mb-8 text-center">
            Guia visual para planejamento de rotas de evacuacao
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            
          </div>

          {/* Carrossel - APENAS UM */}
          <div className="relative bg-black rounded-xl overflow-hidden">
            <div className="relative">
              <img 
                src={`/images/catastrofes/rotas/rotas${imagens[currentIndex]}.jpeg`}
                alt={`Rota de Fuga ${currentIndex + 1}`}
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder.jpg'
                }}
              />
              
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  {currentIndex + 1} / {totalImagens}
                </span>
              </div>
            </div>

            <button
              onClick={irParaAnterior}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md transition"
            >
              <span className="text-xl">←</span>
            </button>

            <button
              onClick={irParaProxima}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md transition"
            >
              <span className="text-xl">→</span>
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {imagens.map((_, index) => (
              <button
                key={index}
                onClick={() => irParaImagem(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? 'bg-[#FFB800] w-6 h-2' 
                    : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex gap-2 justify-center min-w-max">
              {imagens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => irParaImagem(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                    index === currentIndex 
                      ? 'border-[#FFB800]' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img 
                    src={`/images/catastrofes/rotas/rotas${index + 1}.jpeg`}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.jpg'
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <Link
              href="/catastrofes"
              className="text-center bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              ← Voltar para Catástrofes
            </Link>
            <Link
              href="/dashboard"
              className="text-center bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              ← Voltar ao Início
            </Link>
        </div>
      </div>
    </div>
  )
}