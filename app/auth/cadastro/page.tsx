'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Cadastro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return hasUpperCase && hasNumber && hasSpecialChar
  }

 // Função para converter CEP em coordenadas (com fallback gratuito)
const getCoordinatesFromCEP = async (cep: string) => {
  try {
    // Remover caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      console.error('CEP inválido:', cep)
      return { latitude: null, longitude: null }
    }

    // Tentativa 1: Google Maps API (se tiver chave configurada)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (apiKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanCep}&key=${apiKey}`
        )
        const data = await response.json()
        
        if (data.status === 'OK' && data.results && data.results[0]) {
          const { lat, lng } = data.results[0].geometry.location
          console.log('Coordenadas via Google Maps:', { lat, lng })
          return { latitude: lat, longitude: lng }
        }
      } catch (googleError) {
        console.error('Google Maps falhou:', googleError)
      }
    }
    
    // Tentativa 2: ViaCEP + Nominatim (OpenStreetMap - gratuito)
    console.log('Tentando ViaCEP + OpenStreetMap...')
    
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const endereco = await viaCepResponse.json()
    
    if (endereco.erro) {
      throw new Error('CEP não encontrado no ViaCEP')
    }
    
    // Construir query para o Nominatim
    const query = `${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade}, ${endereco.uf}`
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    )
    const nominatimData = await nominatimResponse.json()
    
    if (nominatimData && nominatimData[0]) {
      const lat = parseFloat(nominatimData[0].lat)
      const lon = parseFloat(nominatimData[0].lon)
      console.log('Coordenadas via OpenStreetMap:', { lat, lon })
      return { latitude: lat, longitude: lon }
    }
    
    throw new Error('Não foi possível obter coordenadas')
    
  } catch (error) {
    console.error('Erro ao obter coordenadas:', error)
    return { latitude: null, longitude: null }
  }
}

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validar senha
    if (!validatePassword(password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial')
      setLoading(false)
      return
    }

    // Validar CEP
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setError('CEP inválido. Digite um CEP com 8 dígitos.')
      setLoading(false)
      return
    }

    try {
      // 1. Cadastrar usuário no Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // 2. Obter coordenadas do CEP
        const { latitude, longitude } = await getCoordinatesFromCEP(cep)
        
        let groupId = null
        
        // 3. Se conseguiu obter as coordenadas, buscar ou criar grupo
        if (latitude && longitude) {
          try {
            const { data: grupoIdResult, error: grupoError } = await supabase.rpc(
              'buscar_ou_criar_grupo',
              {
                p_latitude: latitude,
                p_longitude: longitude,
                p_nome_usuario: fullName,
              }
            )
            
            if (grupoError) {
              console.error('Erro ao buscar/criar grupo:', grupoError)
              // Continua mesmo sem grupo - não é crítico
            } else {
              groupId = grupoIdResult
              console.log('Usuário associado ao grupo:', groupId)
            }
          } catch (groupErr) {
            console.error('Exceção ao criar grupo:', groupErr)
            // Continua mesmo sem grupo
          }
        } else {
          console.warn('Não foi possível obter coordenadas para o CEP:', cep)
        }
        
        // 4. Criar perfil na tabela profiles
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            mochila_tipo: 'BOB', // Valor padrão
            cep: cep,
            latitude: latitude || null,
            longitude: longitude || null,
            group_id: groupId,
            created_at: new Date().toISOString(),
          },
        ])
        
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          throw new Error('Erro ao criar perfil. Tente novamente.')
        }
        
        // 5. Redirecionar para dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo e título */}
        <div className="text-center">
          <img 
            src="/logo1.svg" 
            alt="PREPARADO" 
            className="h-16 mx-auto mb-4"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <h2 className="text-3xl font-extrabold text-black">
            Criar conta <span className="text-black">PREPARADO</span>
          </h2>
          <p className="mt-2 text-sm text-black">
            Ou{' '}
            <Link href="/auth/login" className="font-medium text-black hover:text-gray-600 underline">
              faça login na sua conta
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] transition"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] transition"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                id="cep"
                type="text"
                required
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] transition"
                placeholder="00000-000"
              />
              <p className="text-xs text-gray-400 mt-1">
                Usaremos seu CEP para encontrar pessoas próximas a você.
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] transition"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="text-xs text-gray-400 mt-1">
                Deve conter letra maiúscula, número e caractere especial
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-black bg-[#FFB800] hover:bg-[#E5A600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFB800] transition disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}