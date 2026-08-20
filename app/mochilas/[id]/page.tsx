// app/mochilas/[id]/page.tsx (VERSÃO FINAL - CORRIGIDA)
'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

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

export default function MochilaDetalhes({ params }: { params: { id: string } }) {
  const [backpackId, setBackpackId] = useState<number | null>(null)
  const [backpackName, setBackpackName] = useState('')
  const [backpackTipo, setBackpackTipo] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const router = useRouter()

  // 🔥 FUNÇÃO PARA CALCULAR O PROGRESSO TOTAL
  const calcularProgressoTotal = useCallback((itemsList: ChecklistItem[], progressMap: Record<number, boolean>) => {
    // itemsList = TODOS os itens do tipo da mochila (ex: 47 itens)
    // progressMap = itens marcados (ex: só tem 3 itens da categoria Documentos)
    
    const total = itemsList.length
    
    // 🔥 PARA CADA ITEM DA LISTA, VERIFICAR SE ESTÁ MARCADO NO PROGRESS MAP
    // Se não existir no progressMap, considerar como NÃO MARCADO (false)
    const completed = itemsList.filter(item => progressMap[item.id] === true).length
    
    const percentual = total > 0 ? Math.round((completed / total) * 100) : 0
    
    console.log('📊 Cálculo do progresso total:', { 
      totalItens: total, 
      itensMarcados: completed, 
      percentual,
      itensNoProgresso: Object.keys(progressMap).length
    })
    
    return { total, completed, percentual }
  }, [])

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      setBackpackId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      console.log('🔄 Carregando mochila ID:', id)

      // Buscar dados da mochila
      const { data: backpack, error: backpackError } = await supabase
        .from('user_backpacks')
        .select('name, tipo, progress')
        .eq('id', id)
        .single()

      if (backpackError) {
        console.error('Erro ao buscar mochila:', backpackError)
        router.push('/mochilas')
        return
      }

      setBackpackName(backpack.name)
      setBackpackTipo(backpack.tipo)

      // Buscar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })

      setCategories(categoriesData || [])

      // 🔥 BUSCAR TODOS OS ITENS DO TIPO DA MOCHILA
      const { data: allItems } = await supabase
        .from('checklist_items')
        .select('*')
        .contains('tipo', [backpack.tipo])
        .order('order', { ascending: true })

      console.log('📦 Total de itens do tipo', backpack.tipo, ':', allItems?.length)
      
      // 🔥 GUARDAR TODOS OS ITENS
      setItems(allItems || [])

      // 🔥 BUSCAR TODOS OS REGISTROS DE PROGRESSO DO USUÁRIO PARA ESTA MOCHILA
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('item_id, completed')
        .eq('backpack_id', id)

      console.log('📦 Registros de progresso encontrados:', progressData?.length || 0)

      // 🔥 CRIAR O MAPA DE PROGRESSO
      // IMPORTANTE: Se um item não estiver neste mapa, ele é considerado NÃO MARCADO
      const progressMap: Record<number, boolean> = {}
      progressData?.forEach((p: any) => {
        progressMap[p.item_id] = p.completed === true
      })
      setUserProgress(progressMap)

      // 🔥 CALCULAR PROGRESSO TOTAL (TODOS OS ITENS)
      const { total, completed, percentual } = calcularProgressoTotal(allItems || [], progressMap)
      setTotalItems(total)
      setCompletedItems(completed)
      setProgress(percentual)

      console.log('📊 PROGRESSO TOTAL DA MOCHILA:', { 
        total, 
        completed, 
        percentual
      })

      // 🔥 ATUALIZAR O PROGRESSO NO BANCO
      await supabase
        .from('user_backpacks')
        .update({ progress: percentual })
        .eq('id', id)

      console.log('✅ Progresso TOTAL salvo no banco:', percentual + '%')

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      router.push('/mochilas')
    } finally {
      setLoading(false)
    }
  }, [params, router, calcularProgressoTotal])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // 🔥 FUNÇÃO PARA SALVAR ITEM
  const toggleItem = useCallback(async (itemId: number, currentStatus: boolean) => {
    if (!backpackId) return

    setSaving(itemId)
    const newStatus = !currentStatus

    // 🔥 ATUALIZAR INTERFACE IMEDIATAMENTE
    const novoProgressoMap = { ...userProgress, [itemId]: newStatus }
    setUserProgress(novoProgressoMap)
    
    // 🔥 CALCULAR PROGRESSO TOTAL (TODOS OS ITENS)
    const { total, completed, percentual } = calcularProgressoTotal(items, novoProgressoMap)
    setTotalItems(total)
    setCompletedItems(completed)
    setProgress(percentual)
    
    console.log('⚡ Atualização local:', { total, completed, percentual })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Usuario nao autenticado')
        const revertMap = { ...userProgress, [itemId]: currentStatus }
        setUserProgress(revertMap)
        const { total, completed, percentual } = calcularProgressoTotal(items, revertMap)
        setTotalItems(total)
        setCompletedItems(completed)
        setProgress(percentual)
        setSaving(null)
        return
      }

      console.log('💾 Salvando item:', { itemId, newStatus, backpackId })

      // 🔥 USAR UPSERT
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          backpack_id: backpackId,
          item_id: itemId,
          completed: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,backpack_id,item_id'
        })

      if (error) {
        console.error('❌ Erro ao salvar:', error)
        const revertMap = { ...userProgress, [itemId]: currentStatus }
        setUserProgress(revertMap)
        const { total, completed, percentual } = calcularProgressoTotal(items, revertMap)
        setTotalItems(total)
        setCompletedItems(completed)
        setProgress(percentual)
        alert('Erro ao salvar item. Tente novamente.')
        setSaving(null)
        return
      }

      console.log('✅ Item salvo com sucesso')

      // 🔥 RECALCULAR E ATUALIZAR
      const { total: newTotal, completed: newCompleted, percentual: newPercentual } = 
        calcularProgressoTotal(items, novoProgressoMap)
      setTotalItems(newTotal)
      setCompletedItems(newCompleted)
      setProgress(newPercentual)

      // 🔥 ATUALIZAR O PROGRESSO TOTAL NO BANCO
      await supabase
        .from('user_backpacks')
        .update({ progress: newPercentual })
        .eq('id', backpackId)

      console.log('📊 Progresso TOTAL salvo no banco:', newPercentual + '%')

    } catch (error) {
      console.error('❌ Erro ao salvar:', error)
      const revertMap = { ...userProgress, [itemId]: currentStatus }
      setUserProgress(revertMap)
      const { total, completed, percentual } = calcularProgressoTotal(items, revertMap)
      setTotalItems(total)
      setCompletedItems(completed)
      setProgress(percentual)
      alert('Erro ao salvar item. Tente novamente.')
    }

    setSaving(null)
  }, [backpackId, userProgress, items, calcularProgressoTotal])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/mochilas"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">{backpackName}</h1>
            <p className="text-sm text-gray-500">
              {backpackTipo === 'EDC' ? 'Every Day Carry - Dia a dia' :
               backpackTipo === 'BOB' ? 'Bug Out Bag - 72 horas' :
               backpackTipo === 'BOLT' ? 'Bug Out Long Term - Autossuficiencia' :
               'Tipo desconhecido'}
            </p>
          </div>
        </div>

        {/* 🔥 PROGRESSO TOTAL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso Total</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-[#FFB800] h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Math.min(completedItems, totalItems)} de {totalItems} itens marcados
          </p>
        </div>

        {/* Categorias e Itens */}
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryItems = items.filter(item => item.category_id === category.id)
            if (categoryItems.length === 0) return null

            const completed = categoryItems.filter(item => userProgress[item.id] === true).length
            const categoryProgress = categoryItems.length > 0 
              ? Math.round((completed / categoryItems.length) * 100) 
              : 0

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={category.icon}
                      alt={category.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <h2 className="font-bold text-gray-900">{category.name}</h2>
                    <span className="text-xs text-gray-400">
                      ({completed}/{categoryItems.length})
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#FFB800]">
                    {categoryProgress}%
                  </span>
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
                            userProgress[item.id] === true
                              ? 'bg-[#FFB800] border-[#FFB800]'
                              : 'border-gray-300 hover:border-[#FFB800]'
                          }`}
                        >
                          {userProgress[item.id] === true && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="ml-3 flex-1">
                        <p className={`text-sm ${userProgress[item.id] === true ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
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

        <div className="mt-8 space-y-4">
          <Link
            href="/mochilas"
            className="block text-center bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar para Minhas Mochilas
          </Link>

          <Link
            href="/dashboard"
            className="block text-center bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Voltar ao Inicio
          </Link>

          <div>
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}