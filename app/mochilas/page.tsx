// app/mochilas/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface BackpackItem {
  id: number
  category_id: number
  name: string
  description?: string
  order: number
  tipo: string[]
}

interface Category {
  id: number
  name: string
  icon: string
  order: number
}

export default function DetalheMochila() {
  const router = useRouter()
  const params = useParams()
  const backpackId = params.id as string

  const [loading, setLoading] = useState(true)
  const [backpack, setBackpack] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<BackpackItem[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // 🔥 CORRIGIDO: buscar mochila com as any
      const { data: backpackData, error: backpackError } = await (supabase
        .from('user_backpacks') as any)
        .select('*')
        .eq('id', parseInt(backpackId))
        .eq('user_id', user.id)
        .maybeSingle()

      if (backpackError || !backpackData) {
        router.push('/mochilas')
        return
      }

      setBackpack(backpackData)

      // 🔥 CORRIGIDO: usar backpackData.tipo com segurança
      await loadCategories()
      await loadItems(backpackData?.tipo || 'BOB')
      await loadUserProgress(user.id, parseInt(backpackId))

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 CORRIGIDO: loadCategories com as any
  const loadCategories = async () => {
    try {
      const { data } = await (supabase
        .from('categories') as any)
        .select('*')
        .order('order', { ascending: true })
      
      if (data) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // 🔥 CORRIGIDO: loadItems com as any
  const loadItems = async (tipo: string) => {
    try {
      const { data } = await (supabase
        .from('checklist_items') as any)
        .select('*')
        .order('order', { ascending: true })
      
      if (data) {
        const filteredItems = data.filter((item: any) => 
          item.tipo?.includes(tipo) || item.tipo?.length === 0
        )
        setItems(filteredItems)
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    }
  }

  // 🔥 CORRIGIDO: loadUserProgress com as any
  const loadUserProgress = async (userId: string, backpackId: number) => {
    try {
      const { data } = await (supabase
        .from('user_backpack_progress') as any)
        .select('item_id, completed')
        .eq('user_id', userId)
        .eq('backpack_id', backpackId)
      
      if (data) {
        const progressMap: Record<number, boolean> = {}
        data.forEach((p: any) => {
          progressMap[p.item_id] = p.completed
        })
        setUserProgress(progressMap)
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    }
  }

  // 🔥 CORRIGIDO: toggleItem com as any
  const toggleItem = async (itemId: number, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(itemId)
    const newStatus = !currentStatus

    setUserProgress(prev => ({ ...prev, [itemId]: newStatus }))

    const { error } = await (supabase
      .from('user_backpack_progress') as any)
      .upsert({
        user_id: user.id,
        backpack_id: parseInt(backpackId),
        item_id: itemId,
        completed: newStatus,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setUserProgress(prev => ({ ...prev, [itemId]: currentStatus }))
      console.error('Erro ao salvar:', error)
    } else {
      setSaveMessage('✓ Progresso salvo automaticamente')
      setTimeout(() => setSaveMessage(''), 2000)
    }
    setSaving(null)
  }

  const getCategoryProgress = (categoryId: number) => {
    const categoryItems = items.filter(item => item.category_id === categoryId)
    if (categoryItems.length === 0) return 0
    const completed = categoryItems.filter(item => userProgress[item.id]).length
    return Math.round((completed / categoryItems.length) * 100)
  }

  const getTotalProgress = () => {
    if (items.length === 0) return 0
    const completed = items.filter(item => userProgress[item.id]).length
    return Math.round((completed / items.length) * 100)
  }

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'EDC') return 'Every Day Carry - Dia a dia'
    if (tipo === 'BOB') return 'Bug Out Bag - 72 horas'
    return 'Bug Out Long Term - Autossuficiência'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (!backpack) return null

  const totalProgress = getTotalProgress()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">{backpack.name}</h1>
            <p className="text-sm text-gray-500">{getTipoLabel(backpack.tipo)}</p>
          </div>
          <Link
            href="/mochilas"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Progresso Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso Total</span>
            <span>{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-[#FFB800] h-4 rounded-full transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {items.filter(i => userProgress[i.id]).length} de {items.length} itens marcados
          </p>
        </div>

        {/* Categorias */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = items.filter(item => item.category_id === category.id)
            if (categoryItems.length === 0) return null
            const progress = getCategoryProgress(category.id)
            const completedCount = categoryItems.filter(i => userProgress[i.id]).length

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img 
                          src={category.icon}
                          alt={category.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{category.name}</h2>
                        <p className="text-xs text-gray-500">
                          {completedCount} de {categoryItems.length} itens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[#FFB800]">{progress}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-[#FFB800] h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="flex items-start p-4 hover:bg-gray-50 transition">
                      <button
                        onClick={() => toggleItem(item.id, userProgress[item.id] || false)}
                        disabled={saving === item.id}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            userProgress[item.id]
                              ? 'bg-[#FFB800] border-[#FFB800]'
                              : 'border-gray-300 hover:border-[#FFB800]'
                          }`}
                        >
                          {userProgress[item.id] && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="ml-3 flex-1">
                        <p className={`text-sm ${userProgress[item.id] ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/mochilas"
            className="block text-center bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar para minhas mochilas
          </Link>

          <div>
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}