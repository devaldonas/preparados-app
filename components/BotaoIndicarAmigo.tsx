'use client'

import { useState, useEffect } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function BotaoIndicarAmigo() {
  const [copied, setCopied] = useState(false)
  const [codigoIndicacao, setCodigoIndicacao] = useState('')
  const [loading, setLoading] = useState(true)

  // Buscar o código de indicação do usuário
  useEffect(() => {
    const getCodigo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCodigoIndicacao(user.id.substring(0, 8))
        }
      } catch (error) {
        console.error('Erro ao buscar código de indicação:', error)
      } finally {
        setLoading(false)
      }
    }
    getCodigo()
  }, [])

  // Mensagem completa com código de indicação (bônus R$ 1,00)
  const mensagemCompleta = 
    `QUERO TE FAZER UM CONVITE\n\n` +
    `Sabe aquela coisa que a gente sempre fala: "é melhor estar preparado antes de precisar"?\n\n` +
    `Foi pensando nisso que comecei a usar o PREPARADO e achei que você também deveria conhecer.\n\n` +
    `O mais legal é que você pode ter acesso a mentoria com especialistas, para aprender de forma simples e prática como se preparar e como agir diante de diferentes situações de emergência.\n\n` +
    `Além disso, o app oferece:\n\n` +
    `• Checklist para montar sua mochila de emergência\n` +
    `• Guias práticos para diferentes tipos de catástrofes\n` +
    `• Conexão com pessoas próximas e formação de grupos\n` +
    `• Chat em tempo real com a sua comunidade\n` +
    `• Conteúdos e dicas de preparação\n\n` +
    `Não é para ficar com medo. É justamente o contrário.\n\n` +
    `É para ter informação, tranquilidade e saber o que fazer se um dia precisar.\n\n` +
    `Quero você preparado também.\n\n` +
    `Use este código de indicação: ${codigoIndicacao || 'XXXXXXXX'}\n` +
    `Ao se cadastrar com este código, você ganha bônus!\n\n` +
    `Acesse e conheça:\n` +
    `https://preparado.vercel.app/\n\n` +
    `PREPARADO. Porque cuidar de quem a gente gosta também é ajudar a estar preparado.`

  // Link com código de indicação
  const linkComIndicacao = `https://preparado.vercel.app/auth/cadastro?ref=${codigoIndicacao || ''}`

  const handleCompartilharWhatsApp = () => {
    const mensagemEncoded = encodeURIComponent(mensagemCompleta)
    const url = `https://api.whatsapp.com/send?text=${mensagemEncoded}`
    
    const newWindow = window.open(url, '_blank')
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = `https://wa.me/?text=${mensagemEncoded}`
    }
  }

  const handleCompartilharCopiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagemCompleta)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = mensagemCompleta
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const isIphone = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
  }

  const handleCompartilhar = () => {
    if (isIphone()) {
      const mensagemEncoded = encodeURIComponent(mensagemCompleta)
      window.location.href = `https://wa.me/?text=${mensagemEncoded}`
    } else {
      const mensagemEncoded = encodeURIComponent(mensagemCompleta)
      window.open(`https://api.whatsapp.com/send?text=${mensagemEncoded}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCompartilhar}
        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-[#1da851] text-white py-2.5 px-4 rounded-lg font-medium transition text-sm"
      >
        <img 
          src="/images/whatsapp-icon.svg" 
          alt="WhatsApp" 
          className="w-5 h-5"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        Compartilhar no WhatsApp
      </button>
      <button
        onClick={handleCompartilharCopiar}
        className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition text-sm"
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-600" />
            Copiado!
          </>
        ) : (
          <>
            <Copy size={16} />
            Copiar mensagem
          </>
        )}
      </button>
    </div>
  )
}
