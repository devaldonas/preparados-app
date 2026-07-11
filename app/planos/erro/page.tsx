'use client'

import Link from 'next/link'
import { XCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PlanoErroPage() {
  const handleTentarNovamente = () => {
    window.location.href = '/planos'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        {/* Ícone de erro */}
        <div className="relative inline-block mx-auto mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={48} className="text-red-600" />
          </div>
          <div className="absolute -top-1 -right-1">
            <span className="text-2xl">😕</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ops! Algo deu errado
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Não foi possível processar sua assinatura. Verifique os dados do pagamento e tente novamente.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            Possíveis motivos:
          </p>
          <ul className="text-sm text-red-600 mt-2 space-y-1">
            <li>• • Cartão recusado ou dados incorretos</li>
            <li>• • Saldo insuficiente</li>
            <li>• • Problema temporário no processador de pagamento</li>
            <li>• • Transação não autorizada pelo banco</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTentarNovamente}
            className="w-full flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          <Link
            href="/planos"
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            <ArrowLeft size={18} />
            Voltar para Planos
          </Link>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            💡 Se o problema persistir, entre em contato com nosso suporte:
            <br />
            <a href="mailto:suporte@eaepreparado.com" className="text-[#FFB800] hover:underline">
              suporte@eaepreparado.com
            </a>
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Nenhum valor foi cobrado. Você pode tentar novamente quando quiser.
        </p>
      </div>
    </div>
  )
}