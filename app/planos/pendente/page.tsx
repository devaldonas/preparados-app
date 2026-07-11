'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, RefreshCw, ArrowLeft, Mail } from 'lucide-react'

export default function PlanoPendentePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(60)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Timer para sugerir verificar novamente
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleVerificarPagamento = async () => {
    setChecking(true)
    // Simular verificação
    setTimeout(() => {
      setChecking(false)
      router.push('/dashboard')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        {/* Ícone de pendente */}
        <div className="relative inline-block mx-auto mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock size={48} className="text-yellow-600" />
          </div>
          <div className="absolute -top-1 -right-1">
            <span className="text-2xl">⏳</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento em Análise
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Seu pagamento está sendo processado. Em breve você receberá a confirmação.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-yellow-700 font-medium flex items-center gap-2">
            <Clock size={16} />
            Status do pagamento:
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Aguardando confirmação da instituição financeira.
            <br />
            Isso pode levar alguns minutos.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleVerificarPagamento}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {checking ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Verificar Status
              </>
            )}
          </button>

          <Link
            href="/planos"
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            <ArrowLeft size={18} />
            Voltar para Planos
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-center justify-center gap-2">
            <Mail size={14} />
            Você receberá um e-mail de confirmação.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {countdown > 0 ? (
              `Aguarde ${countdown} segundos para verificar novamente...`
            ) : (
              'Já pode verificar o status do pagamento.'
            )}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Processando...
        </div>
      </div>
    </div>
  )
}