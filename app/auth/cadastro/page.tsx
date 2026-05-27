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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validatePassword(password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            mochila_tipo: 'BOB',
            cep: cep,
          },
        ])
      }
      router.push('/dashboard')
    }
    setLoading(false)
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