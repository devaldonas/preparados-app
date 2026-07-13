import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFB800]/5 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#FFB800]/10 to-white px-6 py-8 text-center">
            <img 
              src="/logo1.svg" 
              alt="PREPARADO" 
              className="h-40 mx-auto" // 🔥 AUMENTADO de h-32 para h-40
            />
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600 italic text-sm">
                "A maior arma de todas é a mente humana."
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/cadastro"
                className="block w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition text-center"
              >
                Cadastre-se
              </Link>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              <Link
                href="/auth/login"
                className="block w-full bg-black hover:bg-gray-900 text-[#FFB800] font-semibold py-3 rounded-lg transition text-center"
              >
                Entre
              </Link>
            </div>
          </div>
        </div>

        {/* Card - Seja um Parceiro */}
        <div className="mt-6 bg-white rounded-2xl border-2 border-[#FFB800]/30 shadow-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-6">
            <div className="flex flex-col items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#FFB800]/20 rounded-full flex items-center justify-center">
                  <img 
                    src="/images/parceiro-icon.png" 
                    alt="Parceiro" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Seja um Parceiro
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Como parceiro você pode vender seus produtos em nossa loja e alcançar milhares de clientes preparados.
                </p>
                <div className="mt-3">
                  <Link
                    href="/auth/cadastro-parceiro"
                    className="inline-block w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-2.5 rounded-lg transition text-center"
                  >
                    Quero ser parceiro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Ao continuar, você concorda com nossos termos de uso
          </p>
        </div>
      </div>
    </div>
  )
}