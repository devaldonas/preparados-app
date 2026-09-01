'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Check, CreditCard, Smartphone, Monitor } from 'lucide-react'

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [usuarioTemAcessoGratuito, setUsuarioTemAcessoGratuito] = useState(false)
  const [plataforma, setPlataforma] = useState<'web' | 'mobile'>('web')

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setPlataforma(isMobile ? 'mobile' : 'web')
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('acesso_gratuito_ate, subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.acesso_gratuito_ate && new Date(profile.acesso_gratuito_ate) > new Date()) {
        setUsuarioTemAcessoGratuito(true)
        router.push('/dashboard')
        return
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 MODO DEMONSTRAÇÃO PARA PLAY STORE
  const handleAssinarMobile = async () => {
    setProcessing(true)

    try {
      // 🔥 SIMULAR COMPRA NA PLAY STORE
      // Em produção, aqui seria integração com Google Play Billing
      
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          acesso_gratuito_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao ativar assinatura:', error)
        alert('Erro ao ativar assinatura.')
        setProcessing(false)
        return
      }

      alert('✅ Assinatura ativada com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('Erro ao processar pagamento.')
    } finally {
      setProcessing(false)
    }
  }

  const handleAssinarWeb = async () => {
    // 🔥 REDIRECIONAR PARA MERCADO PAGO (WEB)
    // Ou implementar Stripe
    alert('🔧 Em breve: Pagamento via Mercado Pago para Web')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (usuarioTemAcessoGratuito) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Plano Anual
          </h1>
          <p className="text-gray-500 mt-2">
            Acesso completo por 1 ano
          </p>
          
          {/* Indicador de plataforma */}
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            {plataforma === 'mobile' ? (
              <>
                <Smartphone size={18} className="text-[#FFB800]" />
                <span className="text-sm text-gray-600">Versão Mobile</span>
              </>
            ) : (
              <>
                <Monitor size={18} className="text-[#FFB800]" />
                <span className="text-sm text-gray-600">Versão Web</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-[#FFB800] p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Anual</h3>
              <p className="text-sm text-gray-500 mt-1">Acesso completo por 1 ano</p>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#FFB800]">
                  12x de R$ 4,17
                </span>
                <span className="text-sm text-gray-400 ml-1">/ano</span>
                <p className="text-xs text-gray-400 mt-1">Total: R$ 50,00</p>
              </div>

              <ul className="mt-6 space-y-2 text-left">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Acesso a todos os checklists</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Conexão com grupos</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Chat em tempo real</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Guia de catástrofes</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
                  <span>Dicas diárias</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Finalizar Assinatura</h2>
            <p className="text-sm text-gray-500 mt-2">
              {plataforma === 'mobile' 
                ? '📱 Assinatura via Google Play Store' 
                : '💻 Assinatura via Mercado Pago'}
            </p>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                {plataforma === 'mobile' 
                  ? '🔹 Você será direcionado para o Google Play para concluir o pagamento.'
                  : '🔹 Você será direcionado para o Mercado Pago para concluir o pagamento.'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Total: R$ 50,00 (12x de R$ 4,17)
              </p>
            </div>
          </div>

          {plataforma === 'mobile' ? (
            <button
              onClick={handleAssinarMobile}
              disabled={processing}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {processing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Smartphone size={20} />
                  Assinar via Google Play
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleAssinarWeb}
              disabled={processing}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <>
                <CreditCard size={20} />
                Assinar via Mercado Pago
              </>
            </button>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            🔒 Pagamento seguro
          </p>

          <p className="text-xs text-gray-400 text-center mt-2">
            Cancele quando quiser
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao assinar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  )
}
