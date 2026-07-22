'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import InfoTooltip from '@/components/InfoTooltip'
import { getDescricaoItem } from '@/lib/descricoesMochila'

interface ChecklistItem {
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

interface Backpack {
  id: number
  name: string
  tipo: string
  progress: number
}

export default function MochilaChecklist() {
  const params = useParams()
  const router = useRouter()
  const backpackId = params.id as string

  const [backpack, setBackpack] = useState<Backpack | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    carregarDados()
  }, [backpackId])

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: backpackData } = await supabase
      .from('user_backpacks')
      .select('*')
      .eq('id', backpackId)
      .single()

    if (backpackData) {
      setBackpack(backpackData)
    }

    await loadCategories()
    await loadItems(backpackData?.tipo || 'BOB')
    await loadUserProgress(user.id, parseInt(backpackId))

    setLoading(false)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true })
    
    if (data) setCategories(data)
  }

  const loadItems = async (tipo: string) => {
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .order('order', { ascending: true })
    
    if (data) {
      const filteredItems = data.filter(item => 
        item.tipo?.includes(tipo) || item.tipo?.length === 0
      )
      setItems(filteredItems)
    }
  }

  const loadUserProgress = async (userId: string, backpackId: number) => {
    const { data } = await supabase
      .from('user_progress')
      .select('item_id, completed')
      .eq('user_id', userId)
      .eq('backpack_id', backpackId)
    
    if (data) {
      const progressMap: Record<number, boolean> = {}
      data.forEach((p) => {
        progressMap[p.item_id] = p.completed
      })
      setUserProgress(progressMap)
    }
  }

  const toggleItem = async (itemId: number, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(itemId)
    const newStatus = !currentStatus

    setUserProgress(prev => ({ ...prev, [itemId]: newStatus }))

    const { error } = await supabase
      .from('user_progress')
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
      await atualizarProgressoMochila()
    }
    setSaving(null)
  }

  const atualizarProgressoMochila = async () => {
    const completedCount = items.filter(item => userProgress[item.id]).length
    const newProgress = Math.round((completedCount / items.length) * 100)

    await supabase
      .from('user_backpacks')
      .update({ progress: newProgress, updated_at: new Date().toISOString() })
      .eq('id', backpackId)

    setBackpack(prev => prev ? { ...prev, progress: newProgress } : null)
  }

  const getItemsByCategory = (categoryId: number) => {
    return items.filter(item => item.category_id === categoryId)
  }

  const getCategoryProgress = (categoryId: number) => {
    const categoryItems = getItemsByCategory(categoryId)
    if (categoryItems.length === 0) return 0
    const completed = categoryItems.filter(item => userProgress[item.id]).length
    return Math.round((completed / categoryItems.length) * 100)
  }

  const getTotalProgress = () => {
    if (items.length === 0) return 0
    const completed = items.filter(item => userProgress[item.id]).length
    return Math.round((completed / items.length) * 100)
  }

  const handleSaveAndContinue = async () => {
    setSavingAll(true)
    setSaveMessage('Salvando seu progresso...')
    
    setTimeout(() => {
      setSaveMessage('Checklist salvo com sucesso!')
      setTimeout(() => {
        setSaveMessage('')
        router.push('/mochilas')
      }, 1000)
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/mochilas"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span> Voltar para minhas mochilas
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src="/images/mochila-icon.png" 
              alt={backpack?.name} 
              className="h-12 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-black">{backpack?.name}</h1>
              <p className="text-gray-500 text-sm">
                {backpack?.tipo === 'EDC' && 'Every Day Carry - Itens para o dia a dia'}
                {backpack?.tipo === 'BOB' && 'Bug Out Bag - 72 horas de emergência'}
                {backpack?.tipo === 'BOLT' && 'Bug Out Long Term - Autossuficiência'}
              </p>
            </div>
          </div>
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

        {/* Categorias do Checklist */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id)
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
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              const fallback = document.createElement('span')
                              fallback.className = 'text-[#FFB800] font-bold text-lg'
                              fallback.textContent = category.name.charAt(0)
                              parent.appendChild(fallback)
                            }
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
                  {categoryItems.map((item) => {
                    // 🔥 BUSCA A DESCRIÇÃO NO MAPEAMENTO CENTRALIZADO
                    const descricao = getDescricaoItem(item.name)
                    
  return (
  <div className="flex items-center p-3 hover:bg-gray-50 transition">
  <button
    onClick={() => toggleItem(item.id, userProgress[item.id] || false)}
    disabled={saving === item.id}
    className="flex-shrink-0"
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
    {/* Nome do item */}
    <div className="flex items-center justify-between gap-2">
      <span className={`text-sm ${userProgress[item.id] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
        {item.name}
      </span>
      {descricao && <InfoTooltip descricao={descricao} />}
    </div>
  </div>
</div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Botões */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSaveAndContinue}
            disabled={savingAll}
            className="w-full bg-[#1A1A1A] text-white py-3 px-4 rounded-lg font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {savingAll ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
          
          <Link
            href="/mochilas"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar para minhas mochilas
          </Link>
        </div>

        {/* Mensagem de salvamento */}
        {saveMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  )
}