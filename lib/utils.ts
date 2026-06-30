import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts (ADICIONAR ESTA FUNÇÃO)

export const formatDate = (date: string | Date, showTime: boolean = true) => {
  if (!date) return 'Data não disponível'
  
  try {
    const data = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(data.getTime())) {
      return 'Data inválida'
    }
    
    // 🔥 AJUSTAR PARA UTC-3 (BRASÍLIA)
    const offset = -3 * 60 // -3 horas em minutos
    const brasilia = new Date(data.getTime() + offset * 60 * 1000)
    
    const dia = String(brasilia.getUTCDate()).padStart(2, '0')
    const mes = String(brasilia.getUTCMonth() + 1).padStart(2, '0')
    const ano = brasilia.getUTCFullYear()
    const horas = String(brasilia.getUTCHours()).padStart(2, '0')
    const minutos = String(brasilia.getUTCMinutes()).padStart(2, '0')
    
    if (showTime) {
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
    return `${dia}/${mes}/${ano}`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}