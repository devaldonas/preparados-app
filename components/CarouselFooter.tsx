'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BotaoCarrossel {
  id: number
  nome: string
  icone: string
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
    icone: '🛒', 
    descricao: 'Equipamentos essenciais para sua mochila',
    href: '/loja', 
    type: 'link',
    cor: 'from-black to-gray-800',
    iconeImg: '/images/preparadofundopreto-icon.png'
  },
  { 
    id: 2, 
    nome: 'Comunicador Via Rádio', 
    icone: '🎙️', 
    descricao: 'PTT - Pressione para falar',
    href: '/comunicador/canal/8bfb8c3e-9fb0-4a43-a781-dc96b0a09baf', 
    type: 'link',
    cor: 'from-[#FFB800] to-[#E5A600]',
    iconeImg: '/images/preparadofundoamarelo-icon.png'
  },
]

export default function CarouselFooter() {
  const [indiceAtivo, setIndiceAtivo] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtivo((prev) => (prev + 1) % botoes.length)
    }, 4000)

    return () => clearInterval(intervalo)
  }, [])

  const botaoAtivo = botoes[indiceAtivo]

  const renderBotao = () => {
    const className = `flex items-center justify-between w-full p-4 bg-gradient-to-r ${botaoAtivo.cor} text-white rounded-xl shadow-lg transition-all duration-500 transform hover:scale-105`

    const conteudo = (
      <>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <img 
              src={botaoAtivo.iconeImg} 
              alt={botaoAtivo.nome} 
              className="h-10 w-auto"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="text-xl font-bold">{botaoAtivo.nome}</span>
          </div>
          <span className="text-xs opacity-90 ml-12">{botaoAtivo.descricao}</span>
        </div>
        <div className="text-right">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">→</span>
          </div>
        </div>
      </>
    )

    if (botaoAtivo.type === 'link') {
      return (
        <Link href={botaoAtivo.href} className={className}>
          {conteudo}
        </Link>
      )
    } else {
      return (
        <a href={botaoAtivo.href} target="_blank" rel="noopener noreferrer" className={className}>
          {conteudo}
        </a>
      )
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/10 to-transparent">
      <div className="max-w-lg mx-auto">
        {renderBotao()}
        
        <div className="flex justify-center gap-2 mt-3">
          {botoes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndiceAtivo(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === indiceAtivo 
                  ? 'bg-[#FFB800] w-6 h-1.5' 
                  : 'bg-gray-400 w-1.5 h-1.5 hover:bg-gray-500'
              }`}
              aria-label={`Ir para ${botoes[idx].nome}`}
            />
          ))}
        </div>
      </div>
    </footer>
  )
}