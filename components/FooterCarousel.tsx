'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BotaoCarrossel {
  id: number
  nome: string
  descricao: string
  href: string
  type: 'link' | 'external'
  cor: string
  iconeImg: string
}

const botoes: BotaoCarrossel[] = [
  { 
    id: 1, 
    nome: 'Loja', 
    descricao: 'Equipamentos essenciais para sua mochila',
    href: '/loja', 
    type: 'link',
    cor: 'from-black to-gray-800',
    iconeImg: '/images/preparadofundopreto-icon.png'
  },
  { 
    id: 2, 
    nome: 'Comunicador Via Rádio', 
    descricao: 'PTT - Pressione para falar',
    href: '/comunicador/canal/8bfb8c3e-9fb0-4a43-a781-dc96b0a09baf', 
    type: 'link',
    cor: 'from-[#FFB800] to-[#E5A600]',
    iconeImg: '/images/preparadofundoamarelo-icon.png'
  },
]

export default function FooterCarousel() {
  const [indiceAtivo, setIndiceAtivo] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtivo((prev) => (prev + 1) % botoes.length)
    }, 4000)

    return () => clearInterval(intervalo)
  }, [])

  if (botoes.length === 0) return null

  return (
    <div className="bg-white border-t border-gray-200 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${indiceAtivo * 100}%)` }}
            >
              {botoes.map((botao) => (
                <div key={botao.id} className="w-full flex-shrink-0">
                  <Link
                    href={botao.href}
                    className={`flex items-center justify-between w-full p-4 bg-gradient-to-r ${botao.cor} text-white rounded-xl shadow-lg transition-all duration-500 hover:scale-105`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-3">
                        <img 
                          src={botao.iconeImg} 
                          alt={botao.nome} 
                          className="h-10 w-auto"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        <span className="text-xl font-bold">{botao.nome}</span>
                      </div>
                      <span className="text-xs opacity-90 ml-12">{botao.descricao}</span>
                    </div>
                    <div className="text-right">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-xl">→</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {botoes.length > 1 && (
            <>
              <button
                onClick={() => setIndiceAtivo((prev) => (prev - 1 + botoes.length) % botoes.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
              >
                ←
              </button>
              <button
                onClick={() => setIndiceAtivo((prev) => (prev + 1) % botoes.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
              >
                →
              </button>
            </>
          )}

          <div className="flex justify-center gap-2 mt-3">
            {botoes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setIndiceAtivo(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === indiceAtivo 
                    ? 'bg-[#FFB800] w-6 h-1.5' 
                    : 'bg-gray-300 w-1.5 h-1.5 hover:bg-gray-400'
                }`}
                aria-label={`Ir para ${botoes[idx].nome}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}