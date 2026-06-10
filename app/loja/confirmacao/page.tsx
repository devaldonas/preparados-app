'use client'

import Link from 'next/link'
import NavBar from '@/components/NavBar'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import CarouselFooter from '@/components/CarouselFooter'

export default function Confirmacao() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar showBackButton={true} backButtonPath="/loja" />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
            <p className="text-gray-500 mb-6">
              Seu pedido foi recebido com sucesso.
              Voce recebera um email com as informacoes da compra.
            </p>
            <Link
              href="/loja"
              className="inline-block bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
            >
              Voltar para Loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}