// components/loja/ShippingCalculator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2, Truck, Clock, DollarSign } from 'lucide-react'

interface ShippingOption {
  id: number
  name: string
  price: number
  delivery_time: number
  company: string
  company_logo: string
  discount: number
}

interface ShippingCalculatorProps {
  cep: string
  products: any[]
  onSelect: (option: ShippingOption) => void
}

export default function ShippingCalculator({ cep, products, onSelect }: ShippingCalculatorProps) {
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cep && cep.length === 8) {
      calcularFrete()
    }
  }, [cep])

  const calcularFrete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Buscar endereço do remetente (configuração da loja)
      const fromAddress = {
        street: 'Rua Exemplo',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip: '01000000'
      }

      const response = await fetch('/api/melhor-envio/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromAddress,
          to: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: cep
          },
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            weight: p.weight || 200, // peso padrão em gramas
            width: p.width || 20,
            height: p.height || 10,
            length: p.length || 30,
            quantity: p.quantity,
            price: p.price
          }))
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular frete')
      }

      setOptions(data.quotes)
      
      // Selecionar primeira opção por padrão
      if (data.quotes.length > 0) {
        setSelected(data.quotes[0].id)
        onSelect(data.quotes[0])
      }

    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      setError('Não foi possível calcular o frete para este CEP')
    } finally {
      setLoading(false)
    }
  }

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
        <span className="ml-2 text-sm text-gray-600">Calculando frete...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        Nenhuma opção de frete disponível para este CEP
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-gray-900 text-sm">Opções de Frete</h3>
      
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => {
            setSelected(option.id)
            onSelect(option)
          }}
          className={`border-2 rounded-lg p-4 cursor-pointer transition ${
            selected === option.id
              ? 'border-[#FFB800] bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {option.company_logo ? (
                <img
                  src={option.company_logo}
                  alt={option.company}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Truck size={20} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">{option.name}</p>
                <p className="text-xs text-gray-500">{option.company}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#FFB800]">
                {formatPrice(option.price)}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {option.delivery_time} dias úteis
              </div>
            </div>
          </div>
          {option.discount > 0 && (
            <div className="mt-2 text-xs text-green-600">
              💰 {formatPrice(option.discount)} de desconto
            </div>
          )}
        </div>
      ))}
    </div>
  )
}