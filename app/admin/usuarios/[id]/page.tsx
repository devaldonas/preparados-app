'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, User, MapPin, Phone, CreditCard, Shield, Copy, Home, Building2, Map, Hash } from 'lucide-react'

interface UsuarioDetalhes {
  id: string
  full_name: string
  email: string
  role: string
  subscription_status: string
  created_at: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  phone: string
  group_id: number
  indicado_por: string
  trial_start_date: string
  trial_end_date: string
  cupom_usado: string
  acesso_gratuito_ate: string
  indicador_nome?: string
}

export default function AdminUsuarioDetalhes() {
  const params = useParams()
  const router = useRouter()
  const [usuario, setUsuario] = useState<UsuarioDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    carregarUsuario()
  }, [])

  const carregarUsuario = async () => {
    try {
      const userId = params.id as string
      
      console.log('🔍 Buscando usuário:', userId)
      
      // 1. Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError)
        throw profileError
      }

      console.log('✅ Perfil encontrado:', profile)

      // 2. Buscar e-mail via RPC
      let email = 'Sem email'
      try {
        console.log('📧 Buscando e-mail via RPC...')
        const { data: emailData, error: emailError } = await supabase
          .rpc('buscar_email_usuario', { p_user_id: userId })

        console.log('📧 Resultado da RPC:', { emailData, emailError })

        if (!emailError && emailData) {
          email = emailData
          console.log('✅ E-mail encontrado via RPC:', email)
        }
      } catch (error) {
        console.error('❌ Erro ao buscar e-mail via RPC:', error)
      }

      // 3. Buscar quem indicou
      let indicadorNome = 'Ninguém'
      if (profile.indicado_por) {
        const { data: indicador } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.indicado_por)
          .single()
        if (indicador) {
          indicadorNome = indicador.full_name
        }
      }

      const usuarioCompleto = {
        ...profile,
        email: email,
        indicador_nome: indicadorNome
      }

      console.log('📦 Usuário completo:', usuarioCompleto)
      setUsuario(usuarioCompleto)
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error)
      setError('Usuário não encontrado')
    } finally {
      setLoading(false)
    }
  }

  const copiarId = () => {
    if (usuario) {
      navigator.clipboard.writeText(usuario.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPhone = (phone: string) => {
    if (!phone) return '-'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      trial: 'bg-blue-100 text-blue-700',
      inactive: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (error || !usuario) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Usuário não encontrado'}</p>
        <Link href="/admin/usuarios" className="text-[#FFB800] hover:underline mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/usuarios"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black">Detalhes do Usuário</h1>
          <p className="text-sm text-gray-500">Informações completas do usuário</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-[#FFB800]" />
            Dados Pessoais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-gray-400">ID do usuário</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-gray-600 break-all">{usuario.id}</p>
                <button
                  onClick={copiarId}
                  className="p-1 hover:bg-gray-100 rounded transition"
                  title="Copiar ID"
                >
                  <Copy size={14} className="text-gray-400" />
                </button>
                {copied && <span className="text-xs text-green-600">Copiado!</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Nome completo</p>
              <p className="font-medium text-gray-900">{usuario.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">E-mail</p>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                {usuario.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Telefone</p>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                {formatPhone(usuario.phone)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Data de cadastro</p>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                {formatDate(usuario.created_at)}
              </p>
            </div>
          </div>

          {/* Endereço */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-[#FFB800]" />
              Endereço
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Logradouro</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Home size={14} className="text-gray-400" />
                  {usuario.street || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Número</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Hash size={14} className="text-gray-400" />
                  {usuario.number || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Complemento</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400" />
                  {usuario.complement || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Bairro</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Map size={14} className="text-gray-400" />
                  {usuario.neighborhood || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cidade</p>
                <p className="font-medium text-gray-900">{usuario.city || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Estado</p>
                <p className="font-medium text-gray-900">{usuario.state || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">CEP</p>
                <p className="font-medium text-gray-900">{usuario.cep || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status e Assinatura */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[#FFB800]" />
            Status
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Função</p>
              <p className={`font-medium ${
                usuario.role === 'admin' ? 'text-[#FFB800]' : 'text-gray-900'
              }`}>
                {usuario.role === 'admin' ? 'Administrador' :
                 usuario.role === 'partner' ? 'Parceiro' : 'Usuário'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status da assinatura</p>
              <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full ${getStatusBadge(usuario.subscription_status)}`}>
                {usuario.subscription_status || 'inativo'}
              </span>
            </div>
            {usuario.acesso_gratuito_ate && (
              <div>
                <p className="text-xs text-gray-400">Acesso gratuito até</p>
                <p className="font-medium text-green-600">{formatDate(usuario.acesso_gratuito_ate)}</p>
              </div>
            )}
            {usuario.trial_start_date && (
              <div>
                <p className="text-xs text-gray-400">Período de teste</p>
                <p className="text-sm text-gray-600">
                  Início: {formatDate(usuario.trial_start_date)}
                </p>
                <p className="text-sm text-gray-600">
                  Fim: {formatDate(usuario.trial_end_date)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Indicado por</p>
              <p className="font-medium text-gray-900">{usuario.indicador_nome || 'Ninguém'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
