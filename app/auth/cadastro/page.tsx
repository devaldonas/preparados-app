// app/auth/cadastro/page.tsx
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
  Calendar
} from 'lucide-react'

export default function Cadastro() {
  const router = useRouter()
  
  // Estados do formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  
  // Validação em tempo real
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    password: { valid: false, message: '' },
    fullName: { valid: false, message: '' },
    cep: { valid: false, message: '' },
    numero: { valid: false, message: '' }
  })

  // Buscar endereço pelo CEP
  const buscarEnderecoPorCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        setError('CEP não encontrado. Verifique o número digitado.')
        setValidations(prev => ({ ...prev, cep: { valid: false, message: 'CEP não encontrado' } }))
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

  // Monitorar mudanças no CEP
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      buscarEnderecoPorCep(cep)
    }
  }, [cep])

  // Validar email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      setValidations(prev => ({ ...prev, email: { valid: false, message: 'E-mail inválido' } }))
    } else if (email) {
      setValidations(prev => ({ ...prev, email: { valid: true, message: '' } }))
    }
  }, [email])

  // Validar senha
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

  // Validar nome
  useEffect(() => {
    if (fullName && fullName.length < 3) {
      setValidations(prev => ({ ...prev, fullName: { valid: false, message: 'Nome muito curto' } }))
    } else if (fullName) {
      setValidations(prev => ({ ...prev, fullName: { valid: true, message: '' } }))
    }
  }, [fullName])

  // Validar CEP
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep && cleanCep.length !== 8) {
      setValidations(prev => ({ ...prev, cep: { valid: false, message: 'CEP deve ter 8 dígitos' } }))
    }
  }, [cep])

  // Validar número
  useEffect(() => {
    if (numero && numero.length > 0) {
      setValidations(prev => ({ ...prev, numero: { valid: true, message: '' } }))
    }
  }, [numero])

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return hasUpperCase && hasNumber && hasSpecialChar && password.length >= 6
  }

  const getCoordinatesFromCEP = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '')
      if (cleanCep.length !== 8) return { latitude: null, longitude: null }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (apiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanCep}&key=${apiKey}`
          )
          const data = await response.json()
          if (data.status === 'OK' && data.results?.[0]) {
            const { lat, lng } = data.results[0].geometry.location
            return { latitude: lat, longitude: lng }
          }
        } catch (googleError) {
          console.error('Google Maps falhou:', googleError)
        }
      }
      
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const endereco = await viaCepResponse.json()
      
      if (endereco.erro) throw new Error('CEP não encontrado')
      
      const query = `${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade}, ${endereco.uf}`
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      )
      const nominatimData = await nominatimResponse.json()
      
      if (nominatimData?.[0]) {
        return {
          latitude: parseFloat(nominatimData[0].lat),
          longitude: parseFloat(nominatimData[0].lon)
        }
      }
      
      throw new Error('Não foi possível obter coordenadas')
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error)
      return { latitude: null, longitude: null }
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!validations.email.valid && email) {
        setError('E-mail inválido')
        return
      }
      if (!validations.password.valid && password) {
        setError('Senha inválida')
        return
      }
      if (!validations.fullName.valid && fullName) {
        setError('Nome inválido')
        return
      }
      if (!email || !password || !fullName) {
        setError('Preencha todos os campos')
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
    if (cleanCep.length !== 8) {
      setError('CEP inválido')
      setLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setError('A senha deve conter letra maiúscula, número e caractere especial')
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        const { latitude, longitude } = await getCoordinatesFromCEP(cep)
        
        let groupId = null
        if (latitude && longitude) {
          try {
            const { data: grupoIdResult, error: grupoError } = await supabase.rpc(
              'buscar_ou_criar_grupo',
              { p_latitude: latitude, p_longitude: longitude, p_nome_usuario: fullName }
            )
            if (!grupoError) groupId = grupoIdResult
          } catch (groupErr) {
            console.error('Exceção ao criar grupo:', groupErr)
          }
        }

        const { error: profileError } = await supabase.from('profiles').insert([{
          id: authData.user.id,
          full_name: fullName,
          mochila_tipo: 'BOB',
          cep: cleanCep,
          latitude: latitude || null,
          longitude: longitude || null,
          group_id: groupId,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trial',
          created_at: new Date().toISOString()
        }])

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          throw new Error('Erro ao criar perfil')
        }

        router.push('/auth/welcome')
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header com progresso */}
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
            {/* Título */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 && 'Criar conta'}
                {step === 2 && 'Endereço'}
                {step === 3 && 'Finalizar'}
              </h2>
            </div>

            {/* Exibição de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* STEP 1: Dados Básicos */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo
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
                    {fullName && !validations.fullName.valid && (
                      <p className="text-xs text-red-500 mt-1">{validations.fullName.message}</p>
                    )}
                  </div>

                  {/* E-mail */}
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
                        placeholder="seu@email.com"
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
                    {email && !validations.email.valid && (
                      <p className="text-xs text-red-500 mt-1">{validations.email.message}</p>
                    )}
                  </div>

                  {/* Senha */}
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

              {/* STEP 2: Endereço */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* CEP */}
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
                    {cep && !validations.cep.valid && (
                      <p className="text-xs text-red-500 mt-1">{validations.cep.message}</p>
                    )}
                  </div>

                  {/* Logradouro */}
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

                  {/* Número + Complemento */}
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

                  {/* Bairro */}
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

                  {/* Cidade + Estado */}
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

              {/* STEP 3: Revisão */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Nome</span>
                      <span className="text-gray-900 font-medium">{fullName}</span>
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
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                      <span className="text-gray-500">Teste grátis</span>
                      <span className="text-green-600 font-medium">30 dias</span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      Ao criar sua conta, você concorda com os termos de uso e política de privacidade.
                    </p>
                  </div>
                </div>
              )}

              {/* Botões de Navegação */}
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

            {/* Link para login */}
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

        {/* Rodapé */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Seus dados estão seguros. Não compartilhamos suas informações.
          </p>
        </div>
      </div>
    </div>
  )
}