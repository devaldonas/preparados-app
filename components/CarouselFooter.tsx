'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BotaoCarrossel {
  id: number
  nome: string
  icone: string
  descricao: string
  href: string
  type: 'link' | 'external'
  cor: string
}

const botoes: BotaoCarrossel[] = [
  { 
    id: 1, 
    nome: 'Loja', 
    icone: '📦', 
    descricao: 'Equipamentos essenciais para sua mochila',
    href: '/loja', 
    type: 'link',
    cor: 'from-blue-600 to-cyan-600'
  },
  { 
    id: 2, 
    nome: 'Painel Global', 
    icone: '🌍', 
    descricao: 'Monitoramento climático em tempo real',
    href: 'https://www.painelglobal.com.br', 
    type: 'external',
    cor: 'from-green-600 to-emerald-600'
  },
  { 
    id: 3, 
    nome: 'Rádio Diamante', 
    icone: '📡', 
    descricao: 'Informações e orientações ao vivo',
    href: 'https://fmdiamante.com.br', 
    type: 'external',
    cor: 'from-purple-600 to-indigo-600'
  },
  { 
    id: 4, 
    nome: 'Comunicador Via Rádio', 
    icone: '💬', 
    descricao: 'Canal de emergência e comunicação',
    href: 'https://wa.me/?text=🚨 *PREPARADOS - COMUNICADO DE EMERGÊNCIA* 🚨%0A%0AAcionei o comunicador do aplicativo PREPARADOS.%0A%0APreciso de informações e orientações.%0A%0A*Favor retornar o contato.*', 
    type: 'external',
    cor: 'from-orange-600 to-red-600'
  },
]

export default function CarouselFooter() {
  const [indiceAtivo, setIndiceAtivo] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtivo((prev) => (prev + 1) % botoes.length)
    }, 4000) // Troca a cada 4 segundos

    return () => clearInterval(intervalo)
  }, [])

  const botaoAtivo = botoes[indiceAtivo]

  const renderBotao = () => {
    const className = `flex items-center justify-between w-full p-5 bg-gradient-to-r ${botaoAtivo.cor} text-white rounded-2xl shadow-xl transition-all duration-500 transform hover:scale-105`

    const conteudo = (
      <>
        <div className="flex flex-col items-start gap-1">
          <span className="text-4xl">{botaoAtivo.icone}</span>
          <span className="text-2xl font-bold">{botaoAtivo.nome}</span>
          <span className="text-sm opacity-90">{botaoAtivo.descricao}</span>
        </div>
        <div className="text-right">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">→</span>
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
    <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/20 to-transparent">
      <div className="max-w-lg mx-auto">
        {/* Botão ativo do carrossel - tela inteira */}
        {renderBotao()}
        
        {/* Indicadores (dots) */}
        <div className="flex justify-center gap-3 mt-4">
          {botoes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndiceAtivo(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === indiceAtivo 
                  ? 'bg-green-600 w-8 h-2' 
                  : 'bg-gray-400 w-2 h-2 hover:bg-gray-500'
              }`}
              aria-label={`Ir para ${botoes[idx].nome}`}
            />
          ))}
        </div>
      </div>
    </footer>
  )
}