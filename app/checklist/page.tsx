'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function Checklist() {
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({})
  const [mochilaTipo, setMochilaTipo] = useState<string>('BOB')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadProfile(user.id)
        await loadCategories()
        await loadItems()
        await loadUserProgress(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('mochila_tipo')
      .eq('id', userId)
      .single()
    
    if (data) {
      setMochilaTipo(data.mochila_tipo)
    }
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true })
    
    if (data && data.length > 0) {
      setCategories(data)
    } else {
      await createDefaultCategories()
    }
  }

  const loadItems = async () => {
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .order('order', { ascending: true })
    
    if (data && data.length > 0) {
      const filteredItems = data.filter(item => 
        item.tipo?.includes(mochilaTipo) || item.tipo?.length === 0
      )
      setItems(filteredItems)
    } else {
      await createDefaultItems()
    }
  }

  const createDefaultCategories = async () => {
    setInitializing(true)
    const defaultCategories = [
      { name: 'Documentos', icon: '📄', order: 1 },
      { name: 'Água', icon: '💧', order: 2 },
      { name: 'Abrigo', icon: '🏠', order: 3 },
      { name: 'Fogo', icon: '🔥', order: 4 },
      { name: 'Primeiros Socorros', icon: '🩺', order: 5 },
      { name: 'Higiene', icon: '🧼', order: 6 },
      { name: 'Tecnologia', icon: '📱', order: 7 },
      { name: 'Ferramentas', icon: '🔧', order: 8 },
      { name: 'Alimentação', icon: '🍲', order: 9 },
      { name: 'Roupas', icon: '👕', order: 10 },
    ]

    for (const cat of defaultCategories) {
      await supabase.from('categories').insert(cat)
    }
    await loadCategories()
    setInitializing(false)
  }

  const createDefaultItems = async () => {
    setInitializing(true)
    const defaultItems = [
      { category_id: 1, name: 'RG e CPF (cópia física)', description: 'Levar cópias plastificadas', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 1, name: 'Dinheiro em espécie', description: 'Cédulas pequenas', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 1, name: 'Documentos digitais (pendrive)', description: 'Cópias em PDF', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 2, name: 'Garrafa/cantil inox', description: 'Resistente e durável', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 2, name: 'Filtro de água', description: 'Purificação portátil', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 2, name: 'Cloro ou iodo', description: 'Desinfecção química', order: 3, tipo: ['BOLT'] },
      { category_id: 3, name: 'Cobertor térmico', description: 'Manta aluminizada', order: 1, tipo: ['BOB', 'BOLT'] },
      { category_id: 3, name: 'Capa de chuva/poncho', description: 'Impermeável', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 3, name: 'Lona grossa', description: 'Para improvisar abrigo', order: 3, tipo: ['BOLT'] },
      { category_id: 4, name: 'Isqueiro', description: 'Comum ou maçarico', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 4, name: 'Pederneira', description: 'Para condições extremas', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 4, name: 'Algodão na vaselina', description: 'Acelerador de fogo', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 5, name: 'Luvas de procedimento', description: 'Par descartável', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Gases e esparadrapo', description: 'Curativos', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Analgésico (Paracetamol)', description: 'Dor e febre', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Torniquete', description: 'Controle de hemorragia', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Papel higiênico', description: 'Pequeno pacote', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 6, name: 'Sabonete bactericida', description: 'Higienização', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Escova e pasta dental', description: 'Tamanho viagem', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Repelente', description: 'Proteção', order: 4, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 7, name: 'Powerbank', description: 'Carregador portátil', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 7, name: 'Lanterna', description: 'Com pilhas extras', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 7, name: 'Rádio comunicador', description: 'Para emergências', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 8, name: 'Faca multi-ferramentas', description: 'Canivete com funções', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 8, name: 'Paracord', description: 'Corda multifilamento', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 8, name: 'Apito', description: 'Sinalização', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 9, name: 'Água engarrafada', description: '3 litros por pessoa', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 9, name: 'Enlatados', description: 'Sardinha, atum, feijão', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 9, name: 'Barras de cereais', description: 'Energia rápida', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 10, name: 'Meias extras', description: 'Par reserva', order: 1, tipo: ['BOB', 'BOLT'] },
      { category_id: 10, name: 'Jaqueta impermeável', description: 'Proteção contra chuva', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 10, name: 'Camisa térmica', description: 'Frio intenso', order: 3, tipo: ['BOLT'] },
    ]

    for (const item of defaultItems) {
      await supabase.from('checklist_items').insert(item)
    }
    await loadItems()
    setInitializing(false)
  }

  const loadUserProgress = async (userId: string) => {
    const { data } = await supabase
      .from('user_progress')
      .select('item_id, completed')
      .eq('user_id', userId)
    
    if (data) {
      const progressMap: Record<number, boolean> = {}
      data.forEach((p) => {
        progressMap[p.item_id] = p.completed
      })
      setUserProgress(progressMap)
    }
  }

  const toggleItem = async (itemId: number, currentStatus: boolean) => {
    if (!user) return

    setSaving(itemId)
    const newStatus = !currentStatus

    setUserProgress(prev => ({ ...prev, [itemId]: newStatus }))

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
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

  const handleSaveAndContinue = async () => {
    setSavingAll(true)
    setSaveMessage('✓ Salvando seu progresso...')
    
    // Pequeno delay para mostrar a mensagem
    setTimeout(() => {
      setSaveMessage('✓ Checklist salvo com sucesso!')
      setTimeout(() => {
        setSaveMessage('')
        router.push('/dashboard')
      }, 1000)
    }, 500)
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

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        <p className="text-gray-600">{initializing ? 'Preparando seu checklist...' : 'Carregando...'}</p>
      </div>
    )
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">🎒 MINHA MOCHILA</h1>
          <p className="text-gray-600">
            {mochilaTipo === 'EDC' && 'Every Day Carry - Itens para o dia a dia'}
            {mochilaTipo === 'BOB' && 'Bug Out Bag - 72 horas de emergência'}
            {mochilaTipo === 'BOLT' && 'Bug Out Long Term - Autossuficiência'}
          </p>
        </div>

        {/* Mensagem de salvamento */}
        {saveMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
            {saveMessage}
          </div>
        )}

        {/* Progresso Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso Total</span>
            <span>{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-500"
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
            const categoryItems = getItemsByCategory(category.id)
            if (categoryItems.length === 0) return null
            const progress = getCategoryProgress(category.id)
            const completedCount = categoryItems.filter(i => userProgress[i.id]).length

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h2 className="font-semibold text-gray-900">{category.name}</h2>
                        <p className="text-xs text-gray-500">
                          {completedCount} de {categoryItems.length} itens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-700">{progress}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
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
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {userProgress[item.id] && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Botões */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSaveAndContinue}
            disabled={savingAll}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {savingAll ? 'Salvando...' : '✅ Salvar e Continuar'}
          </button>
          
          <Link
            href="/dashboard"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}