'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

export default function RotasFuga() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  const imagens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const totalImagens = imagens.length

  const irParaProxima = () => {
    setCurrentIndex((prev) => (prev === totalImagens - 1 ? 0 : prev + 1))
  }

  const irParaAnterior = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImagens - 1 : prev - 1))
  }

  const irParaImagem = (index: number) => {
    setCurrentIndex(index)
  }

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setStartX('touches' in e ? e.touches[0].clientX : e.clientX)
    setIsDragging(true)
    if (showHint) setShowHint(false)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const diff = startX - currentX
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        irParaProxima()
      } else {
        irParaAnterior()
      }
      setIsDragging(false)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <h1 className="text-2xl font-bold text-black mb-2 text-center">Rotas de Fuga</h1>
        <p className="text-gray-500 mb-8 text-center">
          Guia visual para planejamento de rotas de evacuacao
        </p>

        {/* Carrossel com arraste */}
        <div 
          ref={carouselRef}
          className="relative bg-black rounded-xl overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          <img 
            src={`/images/catastrofes/rotas/rotas${imagens[currentIndex]}.jpeg`}
            alt={`Rota de Fuga ${currentIndex + 1}`}
            className="w-full h-auto pointer-events-none"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.jpg'
            }}
          />

          {showHint && (
            <div className="absolute top-1/2 left-0 right-0 text-center pointer-events-none opacity-70">
              <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                ← Arraste para mudar →
              </span>
            </div>
          )}
        </div>

        {/* Dots (indicadores visuais) - SEM CONTADOR NUMÉRICO */}
        <div className="flex justify-center gap-2 mt-4">
          {imagens.map((_, index) => (
            <button
              key={index}
              onClick={() => irParaImagem(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? 'bg-[#FFB800] w-8 h-2' 
                  : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>

        {/* Miniaturas */}
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

        {/* Botões no final da página */}
        <div className="mt-8 space-y-3">
          <BotaoIndicarAmigo />
          
          <Link
            href="/catastrofes"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            ← Voltar para Catástrofes
          </Link>
          
          <Link
            href="/dashboard"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            ← Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  )
}