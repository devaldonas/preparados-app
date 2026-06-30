// components/frete/OpcoesFrete.tsx
'use client'

import { useState } from 'react'
import { Loader2, Truck } from 'lucide-react'

interface OpcaoFrete {
  transportadora: string
  servico: string
  prazo: number
  prazoString: string
  preco: number
  codigo: string
  imagem: string
}

interface OpcoesFreteProps {
  opcoes: OpcaoFrete[]
  loading: boolean
  onSelecionar: (opcao: OpcaoFrete) => void
  selecionado?: string | null
}

export default function OpcoesFrete({ 
  opcoes, 
  loading, 
  onSelecionar,
  selecionado 
}: OpcoesFreteProps) {
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={24} className="animate-spin text-[#FFB800]" />
        <span className="ml-2 text-sm text-gray-500">Calculando frete...</span>
      </div>
    )
  }

  if (opcoes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Truck size={24} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nenhuma opção de frete disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {opcoes.map((opcao) => (
        <button
          key={opcao.codigo}
          onClick={() => onSelecionar(opcao)}
          className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
            selecionado === opcao.codigo
              ? 'border-[#FFB800] bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {opcao.imagem && (
                <img 
                  src={opcao.imagem} 
                  alt={opcao.transportadora}
                  className="h-8 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {opcao.transportadora}
                </p>
                <p className="text-xs text-gray-500">{opcao.servico}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#FFB800] text-sm">
                {formatPrice(opcao.preco)}
              </p>
              <p className="text-xs text-gray-500">{opcao.prazoString}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}