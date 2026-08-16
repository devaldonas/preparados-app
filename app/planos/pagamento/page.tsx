'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function PagamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams?.get('payment_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!paymentId) {
      setStatus('error')
      setMessage('ID do pagamento não encontrado')
      return
    }

    verificarPagamento(paymentId)
  }, [paymentId])

  const verificarPagamento = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/mercadopago/status?payment_id=${paymentId}`)
      const data = await response.json()

      if (data.status === 'approved') {
        setStatus('success')
        setMessage('✅ Pagamento confirmado! Você já pode acessar o app.')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else if (data.status === 'pending') {
        setStatus('loading')
        setMessage('⏳ Pagamento pendente. Aguarde a confirmação...')
        
        setTimeout(() => {
          verificarPagamento(paymentId)
        }, 5000)
      } else {
        setStatus('error')
        setMessage('❌ Pagamento não aprovado. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      setStatus('error')
      setMessage('❌ Erro ao verificar pagamento. Tente novamente.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#FFB800] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Processando pagamento...</h2>
          <p className="text-gray-500 mt-2">Aguarde enquanto confirmamos seu pagamento</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h2>
          <p className="text-gray-600 mt-2">{message}</p>
          <p className="text-sm text-gray-400 mt-4">Redirecionando para o dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <XCircle size={64} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Erro no pagamento</h2>
        <p className="text-gray-600 mt-2">{message}</p>
        <button
          onClick={() => router.push('/planos')}
          className="mt-6 bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
        >
          Voltar para planos
        </button>
      </div>
    </div>
  )
}

export default function PagamentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    }>
      <PagamentoContent />
    </Suspense>
  )
}
