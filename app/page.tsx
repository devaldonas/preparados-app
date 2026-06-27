// app/page.tsx (ESTÁTICO - SEM 'use client')
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFB800]/10 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#FFB800] to-[#E5A600] px-6 py-8 text-center">
            <img 
              src="/logo1.svg" 
              alt="PREPARADO" 
              className="h-16 mx-auto"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
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

              <Link
                href="/auth/cadastro-parceiro"
                className="block w-full border-2 border-[#FFB800] text-black font-semibold py-3 rounded-lg hover:bg-[#FFB800]/10 transition text-center"
              >
                Seja um parceiro
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
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition text-center"
              >
                Já tenho conta
              </Link>
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