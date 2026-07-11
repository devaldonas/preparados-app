'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Crown, Zap } from 'lucide-react'
import Image from 'next/image'

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<'mensal' | 'anual'>('mensal')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    latitude: '',
    longitude: ''
  })

  // Buscar endereço pelo CEP
  const buscarEndereco = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          latitude: '',
          longitude: ''
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'cep') {
      const cepLimpo = value.replace(/\D/g, '')
      if (cepLimpo.length === 8) {
        buscarEndereco(cepLimpo)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validações
    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('E-mail é obrigatório')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (!formData.cep.replace(/\D/g, '')) {
      setError('CEP é obrigatório')
      setLoading(false)
      return
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // 2. Buscar grupo_id do usuário
      const groupId = 18 // grupo padrão

      // 3. Criar perfil do usuário
      const cleanCep = formData.cep.replace(/\D/g, '')
      
      // 🔥 DEFINIR PLANO (7 dias de trial)
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7)

      const { error: profileError } = await supabase.from('profiles').insert([{
        id: authData.user.id,
        full_name: formData.fullName,
        mochila_tipo: 'BOB',
        cep: cleanCep,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        group_id: groupId,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        trial_start_date: new Date().toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        subscription_status: 'trial',
        created_at: new Date().toISOString()
      }])

      if (profileError) throw profileError

      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setError(error.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Preços dos planos
  const planos = {
    mensal: {
      nome: 'Mensal',
      preco: 49.90,
      periodo: 'mês',
      icon: Zap,
      destaque: false
    },
    anual: {
      nome: 'Anual',
      preco: 358.80,
      periodo: 'ano',
      icon: Crown,
      destaque: true,
      desconto: 'Economize 40%'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo1.svg"
            alt="PREPARADO"
            className="h-12 w-auto"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 rounded-xl sm:px-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Crie sua conta</h2>
            <p className="text-sm text-gray-500 mt-1">
              Comece seu teste gratuito de 7 dias
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-600 font-medium">Conta criada com sucesso!</p>
                <p className="text-sm text-green-500">Você será redirecionado para o login...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="Confirme sua senha"
              />
            </div>

            {/* CEP e Endereço */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  placeholder="123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="Rua Exemplo"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  placeholder="Bairro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                name="complement"
                value={formData.complement}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="Apto, Bloco, etc."
              />
            </div>

            {/* 🔥 SELEÇÃO DE PLANO - NOVO */}
            <div className="pt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Escolha seu plano após o teste gratuito
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(planos).map(([key, plano]) => {
                  const Icon = plano.icon
                  const isSelected = planoSelecionado === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlanoSelecionado(key as 'mensal' | 'anual')}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        isSelected
                          ? 'border-[#FFB800] bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${plano.destaque ? 'relative' : ''}`}
                    >
                      {plano.destaque && (
                        <span className="absolute -top-2 -right-2 bg-[#FFB800] text-black text-[0.5rem] font-bold px-2 py-0.5 rounded-full">
                          {plano.desconto}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className={isSelected ? 'text-[#FFB800]' : 'text-gray-400'} />
                        <span className="font-semibold text-sm text-gray-900">{plano.nome}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        R$ {plano.preco.toFixed(2).replace('.', ',')}
                        <span className="text-xs font-normal text-gray-500 ml-1">/{plano.periodo}</span>
                      </p>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                ✅ 7 dias de teste gratuito. Cancele quando quiser.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : success ? (
                <>
                  <CheckCircle size={18} />
                  Conta criada!
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-[#FFB800] hover:underline font-medium">
                Faça login
              </Link>
            </p>
          </div>

          {/* 🔥 REMOVIDO: Link para cadastro de parceiro */}
          {/* <div className="mt-2 text-center">
            <Link href="/auth/cadastro-parceiro" className="text-xs text-gray-400 hover:text-gray-600">
              Cadastrar como parceiro
            </Link>
          </div> */}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Ao criar sua conta, você concorda com nossos termos de uso
          </p>
        </div>
      </div>
    </div>
  )
}