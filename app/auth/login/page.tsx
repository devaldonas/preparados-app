// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        // TODOS os usuários vão para o dashboard
        // O dashboard vai identificar se é admin, parceiro ou usuário comum
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/logo1.svg" 
            alt="PREPARADO" 
            className="h-16 mx-auto mb-4"
          />
          <h2 className="text-3xl font-extrabold text-black">
            Entrar no <span className="text-black">PREPARADO</span>
          </h2>
          <p className="mt-2 text-sm text-black">
            Ou{' '}
            <Link href="/auth/cadastro" className="font-medium text-black hover:text-gray-600 underline">
              crie sua conta gratuitamente
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
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
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] focus:z-10 sm:text-sm transition"
                placeholder="seu@email.com"
              />
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
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] focus:z-10 sm:text-sm transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Link para recuperar senha */}
          <div className="text-right">
            <Link
              href="/auth/recuperar-senha"
              className="text-sm text-black hover:text-gray-600 transition"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-black bg-[#FFB800] hover:bg-[#E5A600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFB800] transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}