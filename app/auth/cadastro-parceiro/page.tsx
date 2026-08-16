'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  Home,
  Building2,
  Map,
  Hash,
  Store
} from 'lucide-react'

export default function CadastroParceiro() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [phone, setPhone] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    password: { valid: false, message: '' },
    fullName: { valid: false, message: '' },
    companyName: { valid: false, message: '' },
    cnpj: { valid: false, message: '' },
    cep: { valid: false, message: '' },
    numero: { valid: false, message: '' }
  })

  const buscarEnderecoPorCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        setError('CEP não encontrado.')
        return
      }

      setLogradouro(data.logradouro || '')
      setBairro(data.bairro || '')
      setCidade(data.localidade || '')
      setEstado(data.uf || '')
      setValidations(prev => ({ ...prev, cep: { valid: true, message: '' } }))
      setError('')
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      setError('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      buscarEnderecoPorCep(cep)
    }
  }, [cep])

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      setValidations(prev => ({ ...prev, email: { valid: false, message: 'E-mail inválido' } }))
    } else if (email) {
      setValidations(prev => ({ ...prev, email: { valid: true, message: '' } }))
    }
  }, [email])

  useEffect(() => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isValid = hasUpperCase && hasNumber && hasSpecialChar && password.length >= 6
    
    if (password && !isValid) {
      let msg = ''
      const missing = []
      if (!hasUpperCase) missing.push('maiúscula')
      if (!hasNumber) missing.push('número')
      if (!hasSpecialChar) missing.push('caractere especial')
      if (password.length < 6) missing.push('mínimo 6 caracteres')
      msg = missing.join(', ')
      setValidations(prev => ({ ...prev, password: { valid: false, message: msg } }))
    } else if (password) {
      setValidations(prev => ({ ...prev, password: { valid: true, message: '' } }))
    }
  }, [password])

  useEffect(() => {
    if (fullName && fullName.length < 3) {
      setValidations(prev => ({ ...prev, fullName: { valid: false, message: 'Nome muito curto' } }))
    } else if (fullName) {
      setValidations(prev => ({ ...prev, fullName: { valid: true, message: '' } }))
    }
  }, [fullName])

  useEffect(() => {
    if (companyName && companyName.length < 3) {
      setValidations(prev => ({ ...prev, companyName: { valid: false, message: 'Nome da empresa muito curto' } }))
    } else if (companyName) {
      setValidations(prev => ({ ...prev, companyName: { valid: true, message: '' } }))
    }
  }, [companyName])

  useEffect(() => {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj && cleanCnpj.length !== 14) {
      setValidations(prev => ({ ...prev, cnpj: { valid: false, message: 'CNPJ deve ter 14 dígitos' } }))
    } else if (cleanCnpj.length === 14) {
      setValidations(prev => ({ ...prev, cnpj: { valid: true, message: '' } }))
    }
  }, [cnpj])

  const handleNextStep = () => {
    if (step === 1) {
      if (!email || !password || !fullName || !companyName || !cnpj) {
        setError('Preencha todos os campos')
        return
      }
      if (!validations.email.valid) {
        setError('E-mail inválido')
        return
      }
      if (!validations.password.valid) {
        setError('Senha inválida')
        return
      }
      if (!validations.fullName.valid) {
        setError('Nome inválido')
        return
      }
      if (!validations.companyName.valid) {
        setError('Nome da empresa inválido')
        return
      }
      if (!validations.cnpj.valid) {
        setError('CNPJ inválido')
        return
      }
      setError('')
      setStep(2)
    } else if (step === 2) {
      const cleanCep = cep.replace(/\D/g, '')
      if (cleanCep.length !== 8) {
        setError('CEP inválido')
        return
      }
      if (!numero || numero.length === 0) {
        setError('Número é obrigatório')
        return
      }
      setError('')
      setStep(3)
    }
  }

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanCep = cep.replace(/\D/g, '')
    const cleanCnpj = cnpj.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      setError('CEP inválido')
      setLoading(false)
      return
    }

    if (cleanCnpj.length !== 14) {
      setError('CNPJ inválido')
      setLoading(false)
      return
    }

    try {
      // 🔥 1. Criar usuário
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // 🔥 2. Criar perfil do parceiro
        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .insert([{
            id: authData.user.id,
            full_name: fullName,
            role: 'partner',
            cep: cleanCep,
            street: logradouro,
            number: numero,
            complement: complemento || '',
            neighborhood: bairro,
            city: cidade,
            state: estado,
            phone: phone || '',
            created_at: new Date().toISOString()
          }])

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError)
          throw new Error('Erro ao criar perfil')
        }

        // 🔥 3. Criar registro na tabela partners
        const { error: partnerError } = await (supabase
          .from('partners') as any)
          .insert([{
            user_id: authData.user.id,
            company_name: companyName,
            cnpj: cleanCnpj,
            email: email,
            phone: phone || '',
            address: `${logradouro}, ${numero}${complemento ? ', ' + complemento : ''}`,
            city: cidade,
            state: estado,
            zip: cleanCep,
            status: 'pending',
            commission_rate: 15.00,
            created_at: new Date().toISOString()
          }])

        if (partnerError) {
          console.error('❌ Erro ao criar parceiro:', partnerError)
          // Não bloquear o cadastro se falhar
        }

        // 🔥 4. Redirecionar para o dashboard do parceiro
        router.push('/parceiro/dashboard')
      }
    } catch (err: any) {
      console.error('❌ Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#FFB800]/5 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo1.svg" 
                  alt="PREPARADO" 
                  className="h-8 w-auto"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="font-display font-bold text-gray-900 text-sm">PREPARADO</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-all ${
                      s === step ? 'bg-[#FFB800] w-6' : s < step ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 && 'Seja um Parceiro'}
                {step === 2 && 'Endereço'}
                {step === 3 && 'Finalizar'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Responsável
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          fullName && validations.fullName.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="Seu nome completo"
                      />
                      {fullName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validations.fullName.valid ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Store size={18} />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          companyName && validations.companyName.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="Nome da sua empresa"
                      />
                      {companyName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validations.companyName.valid ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CNPJ
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building2 size={18} />
                      </div>
                      <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          cnpj && validations.cnpj.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="00.000.000/0000-00"
                      />
                      {cnpj && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validations.cnpj.valid ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin size={18} />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          email && validations.email.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="contato@empresa.com"
                      />
                      {email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validations.email.valid ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          password && validations.password.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password && !validations.password.valid && (
                      <p className="text-xs text-red-500 mt-1">
                        {validations.password.message}
                      </p>
                    )}
                    {password && validations.password.valid && (
                      <p className="text-xs text-green-500 mt-1">Senha válida</p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin size={18} />
                      </div>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          buscandoCep ? 'border-blue-300' : cep && validations.cep.valid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {buscandoCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 size={18} className="animate-spin text-blue-500" />
                        </div>
                      )}
                      {!buscandoCep && cep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validations.cep.valid ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logradouro
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Home size={18} />
                      </div>
                      <input
                        type="text"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition bg-gray-50"
                        placeholder="Rua, Avenida..."
                        disabled={!!logradouro}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Hash size={18} />
                        </div>
                        <input
                          type="text"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                            numero && validations.numero.valid ? 'border-green-500' : 'border-gray-300'
                          }`}
                          placeholder="Nº"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Building2 size={18} />
                        </div>
                        <input
                          type="text"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition"
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Map size={18} />
                      </div>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition bg-gray-50"
                        placeholder="Bairro"
                        disabled={!!bairro}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Map size={18} />
                        </div>
                        <input
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition bg-gray-50"
                          placeholder="Cidade"
                          disabled={!!cidade}
                        />
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Map size={18} />
                        </div>
                        <input
                          type="text"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition bg-gray-50 uppercase"
                          placeholder="UF"
                          maxLength={2}
                          disabled={!!estado}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Responsável</span>
                      <span className="text-gray-900 font-medium">{fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Empresa</span>
                      <span className="text-gray-900 font-medium">{companyName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CNPJ</span>
                      <span className="text-gray-900 font-medium">{cnpj}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Telefone</span>
                      <span className="text-gray-900 font-medium">{phone || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">E-mail</span>
                      <span className="text-gray-900 font-medium">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Endereço</span>
                      <span className="text-gray-900 font-medium text-right">
                        {logradouro}, {numero}
                        {complemento && `, ${complemento}`}
                        <br />
                        {bairro} - {cidade}/{estado}
                        <br />
                        CEP: {cep}
                      </span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      Ao criar sua conta como parceiro, você concorda com os termos de uso e política de privacidade.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Voltar
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Criar conta
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="text-[#FFB800] hover:underline font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Seus dados estão seguros. Não compartilhamos suas informações.
          </p>
        </div>
      </div>
    </div>
  )
}
