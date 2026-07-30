// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 🔥 FUNÇÃO PARA FORMATAR DATA COM FUSO BRASÍLIA (UTC-3)
export const formatDate = (date: string | Date, showTime: boolean = true) => {
  if (!date) return 'Data não disponível'
  
  try {
    const data = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(data.getTime())) {
      return 'Data inválida'
    }
    
    // 🔥 SUBTRAIR 3 HORAS (BRASÍLIA - UTC-3)
    const horaBrasilia = new Date(data.getTime() - 3 * 60 * 60 * 1000)
    
    const dia = String(horaBrasilia.getDate()).padStart(2, '0')
    const mes = String(horaBrasilia.getMonth() + 1).padStart(2, '0')
    const ano = horaBrasilia.getFullYear()
    const horas = String(horaBrasilia.getHours()).padStart(2, '0')
    const minutos = String(horaBrasilia.getMinutes()).padStart(2, '0')
    
    if (showTime) {
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
    return `${dia}/${mes}/${ano}`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}