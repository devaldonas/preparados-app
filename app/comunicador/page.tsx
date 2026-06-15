'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'
import RadioInterface from '@/components/RadioInterface'

export default function Comunicador() {
  const [user, setUser] = useState<any>(null)
  const [canalSelecionado, setCanalSelecionado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleMudarCanal = (canalId: string, canalNome: string) => {
    router.push(`/comunicador/canal/${canalId}?nome=${encodeURIComponent(canalNome)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pb-20">
      <div className="max-w-md mx-auto px-4 py-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Comunicador Via Radio</h1>
          <p className="text-gray-400 text-sm">Selecione um canal para começar</p>
        </div>

        <RadioInterface 
          canalAtualId=""
          onMudarCanal={handleMudarCanal}
        />

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block text-center bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            Voltar ao Início
          </Link>

          <div className="mt-4">
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}