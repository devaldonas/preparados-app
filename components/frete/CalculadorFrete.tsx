// components/frete/CalculadorFrete.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2, MapPin, Truck, Package, AlertCircle } from 'lucide-react'

interface ProdutoFrete {
  id: string
  nome: string
  peso: number // em kg
  altura: number // em cm
  largura: number // em cm
  comprimento: number // em cm
  quantidade: number
  valor: number
}

interface OpcaoFrete {
  transportadora: string
  servico: string
  prazo: number
  prazoString: string
  preco: number
  codigo: string
  imagem: string
}

interface CalculadorFreteProps {
  cepDestino: string
  produtos: ProdutoFrete[]
  onFreteSelecionado: (opcao: OpcaoFrete | null) => void
  cepOrigem?: string
  className?: string
}

export default function CalculadorFrete({
  cepDestino,
  produtos,
  onFreteSelecionado,
  cepOrigem,
  className = ''
}: CalculadorFreteProps) {
  const [loading, setLoading] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [opcoes, setOpcoes] = useState<OpcaoFrete[]>([])
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cep, setCep] = useState(cepDestino || '')

  useEffect(() => {
    if (cepDestino && cepDestino.replace(/\D/g, '').length === 8) {
      setCep(cepDestino)
      calcularFrete()
    }
  }, [cepDestino])

  const calcularFrete = async () => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setError('Digite um CEP válido com 8 dígitos')
      return
    }

    if (produtos.length === 0) {
      setError('Adicione produtos para calcular o frete')
      return
    }

    setCalculando(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          produtos: produtos.map(p => ({
            nome: p.nome,
            peso: p.peso || 1,
            altura: p.altura || 20,
            largura: p.largura || 20,
            comprimento: p.comprimento || 20,
            quantidade: p.quantidade || 1,
            valor: p.valor || 0
          })),
          cepOrigem: cepOrigem || '09835559'
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular frete')
      }

      setOpcoes(data.cotacoes || [])
      
      if (data.cotacoes?.length === 0) {
        setError('Nenhuma opção de frete disponível para este CEP')
      }

      // Limpar seleção anterior
      setSelecionado(null)
      onFreteSelecionado(null)

    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      setError(error instanceof Error ? error.message : 'Erro ao calcular frete')
      setOpcoes([])
    } finally {
      setLoading(false)
      setCalculando(false)
    }
  }

  const handleSelecionar = (opcao: OpcaoFrete) => {
    setSelecionado(opcao.codigo)
    onFreteSelecionado(opcao)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input CEP */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MapPin size={18} />
          </div>
          <input
            type="text"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="Digite seu CEP"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
            maxLength={9}
          />
        </div>
        <button
          onClick={calcularFrete}
          disabled={calculando}
          className="px-4 py-2 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          {calculando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Truck size={18} />
              Calcular
            </>
          )}
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-[#FFB800]" />
          <span className="ml-2 text-sm text-gray-500">Calculando frete...</span>
        </div>
      )}

      {/* Opções de frete */}
      {!loading && opcoes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Package size={16} />
            Opções de Frete
          </p>

          {opcoes.map((opcao) => (
            <button
              key={opcao.codigo}
              onClick={() => handleSelecionar(opcao)}
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

          {/* Resumo da seleção */}
          {selecionado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-green-700">✓ Frete selecionado</span>
              <span className="font-semibold text-green-700">
                {formatPrice(opcoes.find(o => o.codigo === selecionado)?.preco || 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mensagem quando não há produtos */}
      {produtos.length === 0 && !loading && !error && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <Package size={24} className="mx-auto mb-2 text-gray-300" />
          <p>Adicione produtos ao carrinho para calcular o frete</p>
        </div>
      )}
    </div>
  )
}