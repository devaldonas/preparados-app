'use client'

import Link from 'next/link'
import NavBar from '@/components/NavBar'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'

export default function RotasFuga() {
  const imagens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar showBackButton={true} backButtonPath="/catastrofes" />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>

          <div className="mb-6">
            <Link
              href="/catastrofes"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span>←</span> Voltar para Catastrofes
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-black mb-2">Rotas de Fuga</h1>
          <p className="text-gray-500 mb-8">Guia visual para planejamento de rotas de evacuacao</p>

          <div className="space-y-6">
            {imagens.map((numero) => (
              <div 
                key={numero}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <img 
                  src={`/images/catastrofes/rotas/rotas${numero}.jpeg`}
                  alt={`Rota de Fuga ${numero}`}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.jpg'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <CarouselFooter />
    </div>
  )
}