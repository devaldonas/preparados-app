'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Gift,
  Users,
  Tag
} from 'lucide-react'

// Componente interno que usa useSearchParams
function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
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
  const [codigoIndicacao, setCodigoIndicacao] = useState('')
  const [codigoIndicacaoInput, setCodigoIndicacaoInput] = useState('')
  const [nomeIndicador, setNomeIndicador] = useState<string | null>(null)
  const [codigoCupom, setCodigoCupom] = useState('')
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [cupomValido, setCupomValido] = useState<{ valido: boolean; mensagem: string; tipo?: string } | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    password: { valid: false, message: '' },
    fullName: { valid: false, message: '' },
    cep: { valid: false, message: '' },
    numero: { valid: false, message: '' }
  })

  // Pegar código de indicação da URL e buscar o nome do indicador
  useEffect(() => {
    const codigo = searchParams.get('ref')
    if (codigo) {
      setCodigoIndicacao(codigo)
      setCodigoIndicacaoInput(codigo)
      buscarNomeIndicador(codigo)
    }
  }, [searchParams])

  const buscarNomeIndicador = async (codigo: string) => {
    try {
      const { data: indicador, error } = await supabase
        .from('profiles')
        .select('full_name')
        .ilike('id::text', `${codigo}%`)
        .maybeSingle()
      
      if (!error && indicador) {
        setNomeIndicador(indicador.full_name)
      }
    } catch (error) {
      console.error('Erro ao buscar indicador:', error)
    }
  }

  // Validar cupom quando o usuário digitar
  useEffect(() => {
    const validarCupom = async () => {
      if (!codigoCupom.trim()) {
        setCupomValido(null)
        return
      }

      setValidandoCupom(true)
      try {
        const { data, error } = await supabase
          .from('cupons')
          .select('tipo, descricao, valido_ate, max_uso, usado_vezes, ativo')
          .eq('codigo', codigoCupom.toUpperCase().trim())
          .single()

        if (error || !data) {
          setCupomValido({ valido: false, mensagem: 'Código inválido' })
          return
        }

        if (!data.ativo) {
          setCupomValido({ valido: false, mensagem: 'Cupom inativo' })
          return
        }

        if (data.valido_ate && new Date(data.valido_ate) < new Date()) {
          setCupomValido({ valido: false, mensagem: 'Cupom expirado' })
          return
        }

        if (data.max_uso && data.usado_vezes >= data.max_uso) {
          setCupomValido({ valido: false, mensagem: 'Cupom esgotado' })
          return
        }

        const mensagem = data.tipo === 'free_12months' 
          ? 'Acesso gratuito por 12 meses!'
          : data.tipo === 'credito' 
          ? 'Crédito será adicionado à sua carteira!'
          : 'Cupom válido!'

        setCupomValido({ valido: true, mensagem, tipo: data.tipo })
      } catch (error) {
        console.error('Erro ao validar cupom:', error)
        setCupomValido({ valido: false, mensagem: 'Erro ao validar cupom' })
      } finally {
        setValidandoCupom(false)
      }
    }

    const timer = setTimeout(validarCupom, 500)
    return () => clearTimeout(timer)
  }, [codigoCupom])

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
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep && cleanCep.length !== 8) {
      setValidations(prev => ({ ...prev, cep: { valid: false, message: 'CEP deve ter 8 dígitos' } }))
    }
  }, [cep])

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
      
      return { latitude: null, longitude: null }
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error)
      return { latitude: null, longitude: null }
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!email || !password || !fullName) {
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
      setError('Senha inválida')
      setLoading(false)
      return
    }

    const codigoFinal = codigoIndicacaoInput || codigoIndicacao

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
            const cidadeNome = cidade || 'Localização do Usuário'
            
            const { data: existingGroup } = await (supabase
              .from('groups') as any)
              .select('id')
              .eq('city_name', cidadeNome)
              .maybeSingle()

            if (existingGroup) {
              groupId = existingGroup.id
            } else {
              const { data: newGroup, error: groupError } = await (supabase
                .from('groups') as any)
                .insert([{
                  name: `Grupo ${cidadeNome}`,
                  city_name: cidadeNome,
                  center_latitude: latitude || 0,
                  center_longitude: longitude || 0,
                  member_count: 1,
                  is_active: true,
                  created_at: new Date().toISOString()
                }])
                .select('id')
                .single()
              
              if (groupError) {
                console.error('❌ Erro ao criar grupo:', groupError)
              } else if (newGroup) {
                groupId = newGroup.id
              }
            }
          } catch (groupErr) {
            console.error('❌ Erro ao processar grupo:', groupErr)
          }
        }

        let indicadorId = null
        if (codigoFinal) {
          try {
            const { data: indicador } = await (supabase
              .from('profiles') as any)
              .select('id')
              .ilike('id::text', `${codigoFinal}%`)
              .maybeSingle()
            
            if (indicador) {
              indicadorId = indicador.id
            }
          } catch (err) {
            console.error('Erro ao buscar indicador:', err)
          }
        }

        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .insert([{
            id: authData.user.id,
            full_name: fullName,
            cep: cleanCep,
            street: logradouro,
            number: numero,
            complement: complemento || '',
            neighborhood: bairro,
            city: cidade,
            state: estado,
            latitude: latitude || null,
            longitude: longitude || null,
            group_id: groupId,
            indicado_por: indicadorId,
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          }])

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError)
          throw new Error('Erro ao criar perfil')
        }

        if (cupomValido?.valido && codigoCupom.trim()) {
          try {
            const { data: cupomData, error: cupomError } = await supabase.rpc('aplicar_cupom', {
              p_usuario_id: authData.user.id,
              p_codigo: codigoCupom.toUpperCase().trim()
            })

            if (cupomError) {
              console.error('❌ Erro ao aplicar cupom:', cupomError)
            } else {
              console.log('✅ Cupom aplicado:', cupomData)
            }
          } catch (cupomErr) {
            console.error('❌ Erro ao aplicar cupom:', cupomErr)
          }
        }

        if (indicadorId) {
          try {
            await supabase.rpc('adicionar_saldo', {
              p_usuario_id: indicadorId,
              p_valor: 1.00,
              p_tipo: 'indicacao',
              p_descricao: 'Indicação de novo usuário'
            })
            
            await supabase.rpc('adicionar_saldo', {
              p_usuario_id: authData.user.id,
              p_valor: 1.00,
              p_tipo: 'bonus',
              p_descricao: 'Bônus de boas-vindas por indicação'
            })
            
            console.log('✅ Bônus de indicação aplicado!')
          } catch (bonusErr) {
            console.error('❌ Erro ao aplicar bônus:', bonusErr)
          }
        }

        router.push('/planos')
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
                {step === 1 && 'Criar sua conta'}
                {step === 2 && 'Endereço'}
                {step === 3 && 'Finalizar'}
              </h2>
            </div>

            {/* Banner de indicação - SEM ÍCONE E SEM EMOJI */}
            {nomeIndicador && (
              <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  Voce foi convidado por {nomeIndicador}
                </p>
              </div>
            )}

            {(cupomValido?.valido || codigoCupom) && (
              <div className="space-y-2 mb-4">
                {cupomValido?.valido && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <Check size={18} className="text-green-600" />
                    <p className="text-sm text-green-700">{cupomValido.mensagem}</p>
                  </div>
                )}
                {cupomValido?.valido === false && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <X size={18} className="text-red-600" />
                    <p className="text-sm text-red-700">{cupomValido.mensagem}</p>
                  </div>
                )}
              </div>
            )}

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
                      Nome Completo
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
                        placeholder="contato@email.com"
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

                  {/* CAMPO DE CÓDIGO DE INDICAÇÃO */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className="text-gray-400" />
                      <label className="text-sm font-medium text-gray-600">
                        Codigo de indicacao (opcional)
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Gift size={18} />
                      </div>
                      <input
                        type="text"
                        value={codigoIndicacaoInput}
                        onChange={(e) => setCodigoIndicacaoInput(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition bg-gray-50"
                        placeholder="Digite o codigo de quem te indicou"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Se voce foi convidado por alguem, insira o codigo aqui.
                    </p>
                  </div>

                  {/* CAMPO DE CUPOM PROMOCIONAL */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={16} className="text-gray-400" />
                      <label className="text-sm font-medium text-gray-600">
                        Cupom promocional (opcional)
                      </label>
                      {validandoCupom && (
                        <Loader2 size={14} className="animate-spin text-gray-400 ml-auto" />
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Tag size={18} />
                      </div>
                      <input
                        type="text"
                        value={codigoCupom}
                        onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition ${
                          cupomValido?.valido === true ? 'border-green-500 bg-green-50' :
                          cupomValido?.valido === false ? 'border-red-500 bg-red-50' :
                          'border-gray-300'
                        }`}
                        placeholder="Digite seu cupom (ex: INFLUENCER2026)"
                      />
                      {cupomValido?.valido === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Check size={18} className="text-green-500" />
                        </div>
                      )}
                      {cupomValido?.valido === false && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X size={18} className="text-red-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {cupomValido?.valido === true 
                        ? 'Cupom valido! Sera aplicado ao final do cadastro.'
                        : 'Cupom promocional para acesso gratuito ou creditos.'}
                    </p>
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
                        Numero
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
                          placeholder="N"
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
                      <span className="text-gray-500">Nome</span>
                      <span className="text-gray-900 font-medium">{fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">E-mail</span>
                      <span className="text-gray-900 font-medium">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Endereco</span>
                      <span className="text-gray-900 font-medium text-right">
                        {logradouro}, {numero}
                        {complemento && `, ${complemento}`}
                        <br />
                        {bairro} - {cidade}/{estado}
                        <br />
                        CEP: {cep}
                      </span>
                    </div>
                    {(codigoIndicacaoInput || codigoIndicacao) && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">Codigo de indicacao</span>
                        <span className="text-[#FFB800] font-medium">{codigoIndicacaoInput || codigoIndicacao}</span>
                      </div>
                    )}
                    {cupomValido?.valido && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">Cupom</span>
                        <span className="text-green-600 font-medium">{codigoCupom}</span>
                      </div>
                    )}
                    {nomeIndicador && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">Convidado por</span>
                        <span className="text-gray-900 font-medium">{nomeIndicador}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      Ao criar sua conta, voce concorda com os termos de uso e politica de privacidade.
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
                Ja tem uma conta?{' '}
                <Link href="/auth/login" className="text-[#FFB800] hover:underline font-medium">
                  Faca login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Seus dados estao seguros. Nao compartilhamos suas informacoes.
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Suspense
export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    }>
      <CadastroForm />
    </Suspense>
  )
}
