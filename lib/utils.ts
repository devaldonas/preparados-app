// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 🔥 FUNÇÃO PARA FORMATAR DATA (SEM AJUSTE DE FUSO)
export const formatDate = (date: string | Date, showTime: boolean = true) => {
  if (!date) return 'Data não disponível'
  
  try {
    const data = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(data.getTime())) {
      return 'Data inválida'
    }
    const dia = String(data.getDate()).padStart(2, '0')
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const ano = data.getFullYear()
    const horas = String(data.getHours()).padStart(2, '0')
    const minutos = String(data.getMinutes()).padStart(2, '0')
    
    if (showTime) {
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
    return `${dia}/${mes}/${ano}`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}