'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'  // 🔥 REMOVER Confetti

export default function PlanoSucessoPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Redirecionar automaticamente após 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        {/* Ícone de sucesso */}
        <div className="relative inline-block mx-auto mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <div className="absolute -top-1 -right-1">
            <span className="text-2xl"></span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Assinatura Confirmada!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso completo a todas as funcionalidades do PREPARADO.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700">
             Acesso liberado imediatamente
          </p>
          <p className="text-sm text-green-600 mt-1">
            Você será redirecionado em {countdown} segundos...
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition"
          >
            Ir para o Dashboard
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/loja"
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            Explorar a Loja
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Em caso de dúvidas, entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  )
}