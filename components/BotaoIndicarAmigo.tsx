'use client'

export default function BotaoIndicarAmigo() {
  const handleCompartilhar = () => {
    const mensagem = encodeURIComponent(
      `Olá,\n\n` +
      `Estou usando o app PREPARADO e quero compartilhar com voce.\n\n` +
      `E um aplicativo gratuito que auxilia na preparacao para emergencias.\n\n` +
      `O que voce encontra no PREPARADO:\n` +
      `• Checklist completo para sua mochila de emergencia\n` +
      `• Conexao com pessoas proximas e formacao de grupos\n` +
      `• Chat em tempo real com sua comunidade\n` +
      `• Guia completo para catastrofes (terremoto, tsunami, frio extremo)\n` +
      `• Dicas diarias de preparacao\n\n` +
      `Acesse: https://preparado.vercel.app\n\n` +
      `Vamos nos preparar juntos.`
    )
    window.open(`https://wa.me/?text=${mensagem}`, '_blank')
  }

  return (
    <button
      onClick={handleCompartilhar}
      className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-[#1DA851] transition text-sm"
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