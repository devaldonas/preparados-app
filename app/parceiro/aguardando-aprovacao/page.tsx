// app/parceiro/aguardando-aprovacao/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AguardandoAprovacao() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    verificarStatus()
  }, [])

  const verificarStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partnerData, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)
      setStatus(partnerData.status)

      // Se já estiver aprovado, redirecionar para o dashboard
      if (partnerData.status === 'approved') {
        router.push('/parceiro/dashboard')
        return
      }

      // Se estiver rejeitado, mostrar mensagem
      if (partnerData.status === 'rejected') {
        // Pode redirecionar para uma página de rejeição ou mostrar mensagem
      }

    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            Cadastro Rejeitado
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Infelizmente seu cadastro como parceiro foi rejeitado.
          </p>
          {partner?.rejection_reason && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
              Motivo: {partner.rejection_reason}
            </p>
          )}
          <Link
            href="/parceiro/cadastro"
            className="inline-block bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-yellow-600" />
        </div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
          Aguardando Aprovação
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Seu cadastro como parceiro está sendo analisado pela nossa equipe.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600">
            <strong>Empresa:</strong> {partner?.company_name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>CNPJ:</strong> {partner?.cnpj}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> {status === 'pending' ? '⏳ Em análise' : '✅ Aprovado'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Você receberá uma notificação quando seu cadastro for aprovado.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-bold py-2 rounded-lg transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    </div>
  )
}