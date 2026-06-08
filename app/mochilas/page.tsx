'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface UserBackpack {
  id: number
  name: string
  tipo: string
  progress: number
  created_at: string
}

export default function MinhasMochilas() {
  const [backpacks, setBackpacks] = useState<UserBackpack[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newBackpackName, setNewBackpackName] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('BOB')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    carregarMochilas()
  }, [])

  const carregarMochilas = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('user_backpacks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar mochilas:', error)
    } else {
      setBackpacks(data || [])
    }
    setLoading(false)
  }

  const criarMochila = async () => {
    if (!newBackpackName.trim()) {
      alert('Digite um nome para sua mochila')
      return
    }

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('user_backpacks')
      .insert({
        user_id: user?.id,
        name: newBackpackName,
        tipo: selectedTipo,
        progress: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar mochila:', error)
      alert('Erro ao criar mochila. Tente novamente.')
    } else {
      setShowModal(false)
      setNewBackpackName('')
      await carregarMochilas()
    }
    setCreating(false)
  }

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'EDC') return 'Every Day Carry - Dia a dia'
    if (tipo === 'BOB') return 'Bug Out Bag - 72 horas'
    return 'Bug Out Long Term - Autossuficiência'
  }

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'EDC') return ''
    if (tipo === 'BOB') return ''
    return ''
  }

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-[#FFB800]'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          
          
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/mochila-icon.png" 
                alt="Mochilas" 
                className="h-12 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <h1 className="text-2xl font-bold text-black">Minhas Mochilas</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
            >
              <span>+</span> Adicionar Mochila
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">Gerencie todas as suas mochilas de preparação</p>
        </div>

      {/* Guia de Preparacao da Mochila - NOVO CARD */}
      <Link
        href="/guia"
        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFB800] bg-opacity-10 rounded-xl flex items-center justify-center">
            <img 
              src="/images/mochila-icon.png" 
              alt="Guia" 
              className="w-6 h-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Guia de Preparacao da Mochila</h3>
            <p className="text-sm text-gray-500">Dicas e orientacoes para montar sua mochila</p>
          </div>
          <div className="text-[#FFB800]">
            <span className="text-xl">→</span>
          </div>
        </div>
      </Link>

        {/* Lista de mochilas */}
        {backpacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <img 
              src="/images/mochila-icon.png" 
              alt="Mochila" 
              className="w-20 h-20 mx-auto mb-4 opacity-50"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma mochila ainda</h3>
            <p className="text-gray-500 mb-6">Clique em "Adicionar Mochila" para começar sua preparação</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
            >
              Criar primeira mochila
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backpacks.map((backpack) => (
              <Link
                key={backpack.id}
                href={`/mochilas/${backpack.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTipoIcon(backpack.tipo)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{backpack.name}</h3>
                      <p className="text-xs text-gray-500">{getTipoLabel(backpack.tipo)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(backpack.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{backpack.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getProgressColor(backpack.progress)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${backpack.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
              
            ))}
          </div>
        )}

        <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span> Voltar ao Início
          </Link>

{/* Botao Indicar Amigo */}
        <div className="mb-6">
          <BotaoIndicarAmigo />
        </div>

        {/* Modal de criação */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Mochila</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da mochila
                  </label>
                  <input
                    type="text"
                    value={newBackpackName}
                    onChange={(e) => setNewBackpackName(e.target.value)}
                    placeholder="Ex: Mochila do dia a dia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de mochila
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedTipo('EDC')}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        selectedTipo === 'EDC'
                          ? 'border-[#FFB800] bg-[#FFB800] bg-opacity-10'
                          : 'border-gray-200 hover:border-[#FFB800]'
                      }`}
                    >
                      <span className="text-xl block"></span>
                      <span className="text-xs font-semibold">EDC</span>
                      <span className="text-xs text-gray-500 block">Dia a dia</span>
                    </button>
                    <button
                      onClick={() => setSelectedTipo('BOB')}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        selectedTipo === 'BOB'
                          ? 'border-[#FFB800] bg-[#FFB800] bg-opacity-10'
                          : 'border-gray-200 hover:border-[#FFB800]'
                      }`}
                    >
                      <span className="text-xl block"></span>
                      <span className="text-xs font-semibold">BOB</span>
                      <span className="text-xs text-gray-500 block">72 horas</span>
                    </button>
                    <button
                      onClick={() => setSelectedTipo('BOLT')}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        selectedTipo === 'BOLT'
                          ? 'border-[#FFB800] bg-[#FFB800] bg-opacity-10'
                          : 'border-gray-200 hover:border-[#FFB800]'
                      }`}
                    >
                      <span className="text-xl block"></span>
                      <span className="text-xs font-semibold">BOLT</span>
                      <span className="text-xs text-gray-500 block">Longo prazo</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarMochila}
                  disabled={creating}
                  className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Mochila'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}