// lib/frete.ts - Sistema de frete por parceiro
import { supabase } from '@/lib/supabaseClient'

// Mapeamento de regiões por UF
const REGIOES: Record<string, string> = {
  'AC': 'norte', 'AP': 'norte', 'AM': 'norte', 'PA': 'norte', 'RO': 'norte', 'RR': 'norte', 'TO': 'norte',
  'AL': 'nordeste', 'BA': 'nordeste', 'CE': 'nordeste', 'MA': 'nordeste', 'PB': 'nordeste', 'PE': 'nordeste',
  'PI': 'nordeste', 'RN': 'nordeste', 'SE': 'nordeste',
  'DF': 'centro_oeste', 'GO': 'centro_oeste', 'MT': 'centro_oeste', 'MS': 'centro_oeste',
  'ES': 'sudeste', 'MG': 'sudeste', 'RJ': 'sudeste', 'SP': 'sudeste',
  'PR': 'sul', 'RS': 'sul', 'SC': 'sul'
}

// Tabela de preços por região (origem -> destino)
const TABELA_FRETE: Record<string, Record<string, number>> = {
  'sudeste': {
    'sudeste': 15.90,
    'sul': 22.90,
    'centro_oeste': 28.90,
    'nordeste': 35.90,
    'norte': 45.90
  },
  'sul': {
    'sul': 15.90,
    'sudeste': 22.90,
    'centro_oeste': 28.90,
    'nordeste': 38.90,
    'norte': 48.90
  },
  'centro_oeste': {
    'centro_oeste': 15.90,
    'sudeste': 28.90,
    'sul': 28.90,
    'nordeste': 35.90,
    'norte': 42.90
  },
  'nordeste': {
    'nordeste': 15.90,
    'sudeste': 35.90,
    'sul': 38.90,
    'centro_oeste': 35.90,
    'norte': 38.90
  },
  'norte': {
    'norte': 15.90,
    'sudeste': 45.90,
    'sul': 48.90,
    'centro_oeste': 42.90,
    'nordeste': 38.90
  }
}

// 🔥 Função principal para calcular frete
export async function calcularFrete(
  cepOrigem: string,
  cepDestino: string,
  peso: number = 1,
  valorProduto: number = 0,
  isDigital: boolean = false
): Promise<{ valor: number; prazo: string; regiaoOrigem: string; regiaoDestino: string }> {
  
  // Produtos digitais têm frete grátis
  if (isDigital) {
    return { valor: 0, prazo: 'Imediato', regiaoOrigem: '', regiaoDestino: '' }
  }

  // Frete grátis para compras acima de R$ 200
  if (valorProduto >= 200) {
    return { valor: 0, prazo: '3-5 dias úteis', regiaoOrigem: '', regiaoDestino: '' }
  }

  try {
    // Buscar região do CEP de origem (parceiro)
    const regiaoOrigem = await getRegiaoByCep(cepOrigem)
    
    // Buscar região do CEP de destino (cliente)
    const regiaoDestino = await getRegiaoByCep(cepDestino)

    // Calcular frete baseado nas regiões
    let valorFrete = calcularFretePorRegiao(regiaoOrigem, regiaoDestino)
    
    // Ajustar por peso (cada kg adicional aumenta R$ 5)
    if (peso > 1) {
      valorFrete += (peso - 1) * 5
    }

    // Prazo de entrega
    const prazo = calcularPrazo(regiaoOrigem, regiaoDestino)

    return {
      valor: Math.round(valorFrete * 100) / 100,
      prazo,
      regiaoOrigem,
      regiaoDestino
    }

  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    // Fallback: frete fixo
    return {
      valor: 29.90,
      prazo: '5-10 dias úteis',
      regiaoOrigem: 'desconhecida',
      regiaoDestino: 'desconhecida'
    }
  }
}

// 🔥 Buscar região por CEP (via API)
async function getRegiaoByCep(cep: string): Promise<string> {
  if (!cep) return 'sudeste' // fallback
  
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return 'sudeste'

  try {
    // Tentar buscar via API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) throw new Error('Erro ao buscar CEP')
    
    const data = await response.json()
    if (data.erro) throw new Error('CEP não encontrado')
    
    const uf = data.uf
    return REGIOES[uf] || 'sudeste'
    
  } catch (error) {
    console.warn('Erro ao buscar região por CEP, usando fallback:', error)
    return 'sudeste'
  }
}

// 🔥 Calcular frete baseado nas regiões
function calcularFretePorRegiao(origem: string, destino: string): number {
  // Se mesma região, frete mais barato
  if (origem === destino) {
    return 15.90
  }

  // Buscar na tabela
  const frete = TABELA_FRETE[origem]?.[destino]
  if (frete) {
    return frete
  }

  // Fallback: frete baseado na distância aproximada
  const distancias: Record<string, number> = {
    'sudeste-sul': 22.90,
    'sudeste-centro_oeste': 28.90,
    'sudeste-nordeste': 35.90,
    'sudeste-norte': 45.90,
    'sul-sudeste': 22.90,
    'sul-centro_oeste': 28.90,
    'sul-nordeste': 38.90,
    'sul-norte': 48.90,
    'centro_oeste-sudeste': 28.90,
    'centro_oeste-sul': 28.90,
    'centro_oeste-nordeste': 35.90,
    'centro_oeste-norte': 42.90,
    'nordeste-sudeste': 35.90,
    'nordeste-sul': 38.90,
    'nordeste-centro_oeste': 35.90,
    'nordeste-norte': 38.90,
    'norte-sudeste': 45.90,
    'norte-sul': 48.90,
    'norte-centro_oeste': 42.90,
    'norte-nordeste': 38.90
  }

  const key = `${origem}-${destino}`
  return distancias[key] || 29.90
}

// 🔥 Calcular prazo de entrega
function calcularPrazo(origem: string, destino: string): string {
  if (origem === destino) {
    return '2-3 dias úteis'
  }
  
  const distancias: Record<string, string> = {
    'sudeste-sul': '3-4 dias úteis',
    'sudeste-centro_oeste': '3-5 dias úteis',
    'sudeste-nordeste': '4-6 dias úteis',
    'sudeste-norte': '5-7 dias úteis',
    'sul-sudeste': '3-4 dias úteis',
    'sul-centro_oeste': '3-5 dias úteis',
    'sul-nordeste': '4-6 dias úteis',
    'sul-norte': '5-7 dias úteis',
    'centro_oeste-sudeste': '3-5 dias úteis',
    'centro_oeste-sul': '3-5 dias úteis',
    'centro_oeste-nordeste': '4-6 dias úteis',
    'centro_oeste-norte': '5-7 dias úteis',
    'nordeste-sudeste': '4-6 dias úteis',
    'nordeste-sul': '4-6 dias úteis',
    'nordeste-centro_oeste': '4-6 dias úteis',
    'nordeste-norte': '5-7 dias úteis',
    'norte-sudeste': '5-7 dias úteis',
    'norte-sul': '5-7 dias úteis',
    'norte-centro_oeste': '5-7 dias úteis',
    'norte-nordeste': '5-7 dias úteis'
  }

  const key = `${origem}-${destino}`
  return distancias[key] || '5-10 dias úteis'
}

// 🔥 Função para buscar CEP do parceiro
export async function getPartnerAddress(partnerId: string): Promise<{ cep: string; city: string; state: string }> {
  try {
    const { data, error } = await (supabase
      .from('partners') as any)
      .select('address, city, state, zip')
      .eq('id', partnerId)
      .single()

    if (error) throw error

    return {
      cep: data?.zip || '',
      city: data?.city || '',
      state: data?.state || ''
    }
  } catch (error) {
    console.error('Erro ao buscar endereço do parceiro:', error)
    return { cep: '', city: '', state: '' }
  }
}

// 🔥 Função para calcular frete de um pedido
export async function calcularFretePedido(
  items: any[],
  cepDestino: string,
  partnerId: string
): Promise<{ valor: number; prazo: string; detalhes: any[] }> {
  // Buscar endereço do parceiro
  const partnerAddress = await getPartnerAddress(partnerId)
  const cepOrigem = partnerAddress.cep

  let totalFrete = 0
  let prazo = '5-10 dias úteis'
  const detalhes: any[] = []

  for (const item of items) {
    const produto = item.product || {}
    const isDigital = produto.is_digital || false
    const peso = item.weight || 0.5 // peso padrão
    const valor = produto.price || 0

    const frete = await calcularFrete(
      cepOrigem,
      cepDestino,
      peso,
      valor,
      isDigital
    )

    detalhes.push({
      produto: produto.name,
      frete: frete.valor,
      prazo: frete.prazo,
      isDigital
    })

    totalFrete += frete.valor
    if (frete.prazo !== 'Imediato') {
      prazo = frete.prazo
    }
  }

  return {
    valor: Math.round(totalFrete * 100) / 100,
    prazo,
    detalhes
  }
}

// 🔥 Função para verificar frete grátis
export function isFreteGratis(totalProdutos: number, isDigital: boolean): boolean {
  return isDigital || totalProdutos >= 200
}

// 🔥 Função para formatar frete
export function formatFrete(valor: number): string {
  if (valor === 0) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
