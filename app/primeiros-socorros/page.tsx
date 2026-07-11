'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Bandage, Pill, Activity, Phone, AlertTriangle, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function PrimeirosSocorrosPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
              <Image
                src="/images/socorro.jpeg"
                alt="Primeiros Socorros"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-block bg-[#FFB800]/20 text-[#FFB800] text-xs font-bold px-3 py-1 rounded-full mb-2">
                NOVO
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Primeiros Socorros</h1>
              <p className="text-gray-500 text-sm">Guia rápido para situações de emergência</p>
            </div>
          </div>
        </div>

        {/* Cards de informações */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Heart size={20} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">Parada Cardíaca</h3>
            </div>
            <p className="text-sm text-gray-600">
              Realize massagem cardíaca (RCP) a 100-120 compressões por minuto.
              Ligue para o SAMU (192) imediatamente.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Bandage size={20} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900">Ferimentos</h3>
            </div>
            <p className="text-sm text-gray-600">
              Lave com água e sabão. Aplique pressão para estancar o sangramento.
              Cubra com gaze esterilizada.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Pill size={20} className="text-yellow-500" />
              </div>
              <h3 className="font-bold text-gray-900">Intoxicação</h3>
            </div>
            <p className="text-sm text-gray-600">
              Não induza vômito. Ligue para o Centro de Informações 
              Toxicológicas (0800-722-6001).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Phone size={20} className="text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900">Contatos de Emergência</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p> SAMU: 192</p>
              <p> Bombeiros: 193</p>
              <p> Polícia: 190</p>
            </div>
          </div>
        </div>

        {/* Card "Em breve" */}
        <div className="bg-gradient-to-r from-[#FFB800]/10 to-[#E5A600]/10 border border-[#FFB800]/20 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity size={20} className="text-[#FFB800]" />
            <span className="text-sm font-semibold text-gray-700">Mais conteúdos em breve</span>
          </div>
          <p className="text-sm text-gray-500">
            Estamos preparando guias detalhados de primeiros socorros para diferentes situações.
          </p>
        </div>
      </div>
    </div>
  )
}