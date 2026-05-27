'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [logoSrc] = useState('/logo1.svg')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        
        {/* Logo */}
        <img 
          src={logoSrc}
          alt="PREPARADO" 
          className="h-28 mx-auto mb-8"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        
        {/* Título (opcional - pode remover se a logo já tem o nome) */}
        {/* <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          <span className="text-black">PREPARADO</span>
        </h1> */}
        
        {/* Frase motivacional */}
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 italic">
          "A maior arma de todas é a mente humana."
        </p>
        
        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/cadastro"
            className="bg-[#FFB800] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition shadow-md"
          >
            Começar Agora
          </Link>
          <Link
            href="/auth/login"
            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-md"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}