'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

export default function BotaoIndicarAmigo() {
  const [copied, setCopied] = useState(false)

  const mensagemCompleta = 
    `Olá! 👋\n\n` +
    `Estou usando o app PREPARADO e quero compartilhar com você.\n\n` +
    `📱 O PREPARADO é um aplicativo que auxilia na preparação para emergências.\n\n` +
    `O que você encontra no PREPARADO:\n` +
    `✅ Checklist completo para sua mochila de emergência\n` +
    `✅ Conexão com pessoas próximas e formação de grupos\n` +
    `✅ Chat em tempo real com sua comunidade\n` +
    `✅ Guia completo para catástrofes (terremoto, tsunami, frio extremo)\n` +
    `✅ Dicas diárias de preparação\n\n` +
    `🔗 Acesse: https://eaepreparado.vercel.app/\n\n` +
    `Vamos nos preparar juntos! 🚀`

  const handleCompartilharWhatsApp = () => {
    // 🔥 MÉTODO 1: Tentar com api.whatsapp.com (funciona na maioria dos casos)
    const mensagemEncoded = encodeURIComponent(mensagemCompleta)
    const url = `https://api.whatsapp.com/send?text=${mensagemEncoded}`
    
    // Abrir em nova aba/janela
    const newWindow = window.open(url, '_blank')
    
    // 🔥 FALLBACK: Se o Safari bloquear, tentar com wa.me
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback para wa.me (funciona melhor no iPhone)
      window.location.href = `https://wa.me/?text=${mensagemEncoded}`
    }
  }

  const handleCompartilharCopiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagemCompleta)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      // Fallback para navegadores mais antigos
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

  // 🔥 DETECTAR SE É IPHONE
  const isIphone = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
  }

  const handleCompartilhar = () => {
    // 🔥 SE FOR IPHONE, ABRIR COM WA.ME (MAIS CONFIÁVEL)
    if (isIphone()) {
      const mensagemEncoded = encodeURIComponent(mensagemCompleta)
      window.location.href = `https://wa.me/?text=${mensagemEncoded}`
    } else {
      // Android/Desktop: usar api.whatsapp.com
      const mensagemEncoded = encodeURIComponent(mensagemCompleta)
      window.open(`https://api.whatsapp.com/send?text=${mensagemEncoded}`, '_blank')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 🔥 BOTÃO PRINCIPAL - WHATSAPP */}
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
        Indique um Amigo
      </button>

      {/* 🔥 BOTÃO SECUNDÁRIO - COPIAR LINK */}
      <button
        onClick={handleCompartilharCopiar}
        className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition text-sm"
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-600" />
            Link copiado!
          </>
        ) : (
          <>
            <Copy size={16} />
            Copiar link para compartilhar
          </>
        )}
      </button>
    </div>
  )
}