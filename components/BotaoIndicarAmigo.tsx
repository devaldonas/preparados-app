'use client'

export default function BotaoIndicarAmigo() {
  const handleCompartilhar = () => {
    const mensagem = encodeURIComponent(
      `Olá,\n\n` +
      `Estou usando o app PREPARADO e quero compartilhar com você.\n\n` +
      `É um aplicativo que auxilia na preparação para emergências.\n\n` +
      `O que você encontra no PREPARADO:\n` +
      `• Checklist completo para sua mochila de emergência\n` +
      `• Conexão com pessoas próximas e formação de grupos\n` +
      `• Chat em tempo real com sua comunidade\n` +
      `• Guia completo para catástrofes (terremoto, tsunami, frio extremo)\n` +
      `• Dicas diarias de preparação\n\n` +
      `Acesse: https://preparado.vercel.app\n\n` +
      `Vamos nos preparar juntos.`
    )
    
    // Usar api.whatsapp.com que funciona com WhatsApp e WhatsApp Business
    window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank')
  }

  return (
    <button
      onClick={handleCompartilhar}
      className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-[gray] transition text-sm"
    >
      <img 
        src="/images/indicar-amigo-icon.png" 
        alt="Indicar Amigo" 
        className="w-4 h-4 object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      Indique um amigo
    </button>
  )
}