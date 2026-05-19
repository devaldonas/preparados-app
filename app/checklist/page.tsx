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
  const [showModalTroca, setShowModalTroca] = useState(false)
  const [trocando, setTrocando] = useState(false)
  const [kitsAbertos, setKitsAbertos] = useState<Record<string, boolean>>({
    documentos: false,
    agua: false,
    abrigo: false,
    fogo: false,
    primeirosSocorros: false,
    higiene: false,
    tecnologia: false,
    ferramentas: false,
    alimentacao: false,
    roupas: false,
  })
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
      { category_id: 1, name: 'Mapa da região', description: 'Impresso ou digital', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 2, name: 'Garrafa/cantil inox', description: 'Resistente e durável', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 2, name: 'Filtro de água', description: 'Purificação portátil', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 2, name: 'Cloro ou iodo', description: 'Desinfecção química', order: 3, tipo: ['BOLT'] },
      { category_id: 3, name: 'Cobertor térmico', description: 'Manta aluminizada', order: 1, tipo: ['BOB', 'BOLT'] },
      { category_id: 3, name: 'Capa de chuva/poncho', description: 'Impermeável', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 3, name: 'Lona grossa', description: 'Para improvisar abrigo', order: 3, tipo: ['BOLT'] },
      { category_id: 3, name: 'Barraca', description: 'Proteção completa', order: 4, tipo: ['BOLT'] },
      { category_id: 4, name: 'Isqueiro', description: 'Comum ou maçarico', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 4, name: 'Pederneira', description: 'Para condições extremas', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 4, name: 'Algodão na vaselina', description: 'Acelerador de fogo', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 4, name: 'Fogareiro e gás', description: 'Para cozinhar', order: 4, tipo: ['BOLT'] },
      { category_id: 5, name: 'Luvas de procedimento', description: 'Par descartável', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Gases e esparadrapo', description: 'Curativos', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Analgésico (Paracetamol)', description: 'Dor e febre', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 5, name: 'Torniquete', description: 'Controle de hemorragia', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 5, name: 'Termômetro', description: 'Monitoramento', order: 5, tipo: ['BOB', 'BOLT'] },
      { category_id: 5, name: 'Carvão ativado', description: 'Purificação intestinal', order: 6, tipo: ['BOB', 'BOLT'] },
      { category_id: 5, name: 'Soro fisiológico', description: 'Limpeza', order: 7, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Papel higiênico', description: 'Pequeno pacote', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 6, name: 'Sabonete bactericida', description: 'Higienização', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Escova e pasta dental', description: 'Tamanho viagem', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 6, name: 'Repelente', description: 'Proteção', order: 4, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 6, name: 'Protetor solar', description: 'FPS alto', order: 5, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 6, name: 'Cortador de unha', description: 'Higiene', order: 6, tipo: ['BOB', 'BOLT'] },
      { category_id: 7, name: 'Powerbank', description: 'Carregador portátil', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 7, name: 'Lanterna', description: 'Com pilhas extras', order: 2, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 7, name: 'Lanterna de cabeça', description: 'Mãos livres', order: 3, tipo: ['BOB', 'BOLT'] },
      { category_id: 7, name: 'Rádio comunicador', description: 'Para emergências', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 8, name: 'Faca multi-ferramentas', description: 'Canivete com funções', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 8, name: 'Paracord', description: 'Corda multifilamento', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 8, name: 'Apito', description: 'Sinalização', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 8, name: 'Fita isolante', description: 'Reparos rápidos', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 8, name: 'Bússola', description: 'Orientação', order: 5, tipo: ['BOB', 'BOLT'] },
      { category_id: 9, name: 'Água engarrafada', description: '3 litros por pessoa', order: 1, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 9, name: 'Enlatados', description: 'Sardinha, atum, feijão', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 9, name: 'Tsampa', description: 'Suplemento energético', order: 3, tipo: ['EDC', 'BOB', 'BOLT'] },
      { category_id: 9, name: 'Caneca e talheres', description: 'Para refeições', order: 4, tipo: ['BOB', 'BOLT'] },
      { category_id: 9, name: 'Sal', description: 'Tempero e conservação', order: 5, tipo: ['BOB', 'BOLT'] },
      { category_id: 9, name: 'Mel', description: 'Energia natural', order: 6, tipo: ['BOB', 'BOLT'] },
      { category_id: 10, name: 'Meias extras', description: 'Par reserva', order: 1, tipo: ['BOB', 'BOLT'] },
      { category_id: 10, name: 'Jaqueta impermeável', description: 'Proteção contra chuva', order: 2, tipo: ['BOB', 'BOLT'] },
      { category_id: 10, name: 'Camisa térmica', description: 'Frio intenso', order: 3, tipo: ['BOLT'] },
      { category_id: 10, name: 'Bota para trilha', description: 'Adequada para terreno', order: 4, tipo: ['BOB', 'BOLT'] },
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
    
    setTimeout(() => {
      setSaveMessage('✓ Checklist salvo com sucesso!')
      setTimeout(() => {
        setSaveMessage('')
        router.push('/dashboard')
      }, 1000)
    }, 500)
  }

  const trocarMochila = async (novoTipo: string) => {
    if (!user) return
    
    setTrocando(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({ mochila_tipo: novoTipo })
      .eq('id', user.id)
    
    if (error) {
      console.error('Erro ao trocar mochila:', error)
      setSaveMessage('❌ Erro ao trocar mochila')
      setTimeout(() => setSaveMessage(''), 3000)
    } else {
      setMochilaTipo(novoTipo)
      await loadItems()
      await loadUserProgress(user.id)
      setSaveMessage(`✓ Mochila alterada para ${novoTipo === 'EDC' ? 'EDC (uso diário)' : novoTipo === 'BOB' ? 'BOB (72h)' : 'BOLT (longo período)'}`)
      setTimeout(() => setSaveMessage(''), 3000)
    }
    
    setShowModalTroca(false)
    setTrocando(false)
  }

  const toggleKit = (kit: string) => {
    setKitsAbertos(prev => ({ ...prev, [kit]: !prev[kit] }))
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
        {/* Header com botão Trocar Mochila */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="w-20"></div>
            <h1 className="text-3xl font-bold text-green-700">🎒 MINHA MOCHILA</h1>
            <button
              onClick={() => setShowModalTroca(true)}
              disabled={trocando}
              className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition"
            >
              🔄 Trocar Mochila
            </button>
          </div>
          <p className="text-gray-600 italic">
            {mochilaTipo === 'EDC' && 'Every Day Carry - Itens para o dia a dia'}
            {mochilaTipo === 'BOB' && 'Bug Out Bag - 72 horas de emergência'}
            {mochilaTipo === 'BOLT' && 'Bug Out Long Term - Autossuficiência'}
          </p>
          <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <p className="text-green-800 text-sm italic">
              "Não é possível treinar a técnica física para todas as situações da sua vida, 
              mas é possível treinar o estado mental para todas as situações. 
              A maior arma de todas é a mente humana."
            </p>
            <p className="text-green-600 text-xs mt-2">— Escola de Guerreiros</p>
          </div>
        </div>

        {/* Modal de Troca de Mochila */}
        {showModalTroca && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Escolha seu tipo de mochila</h2>
              <p className="text-sm text-gray-600 mb-6">
                Selecione o tipo de mochila que melhor se adapta à sua necessidade:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => trocarMochila('EDC')}
                  className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
                >
                  <span className="text-2xl">🎒</span>
                  <div>
                    <p className="font-bold text-gray-900">EDC</p>
                    <p className="text-xs text-gray-500">Every Day Carry - Itens para o dia a dia</p>
                  </div>
                </button>
                <button
                  onClick={() => trocarMochila('BOB')}
                  className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
                >
                  <span className="text-2xl">🎒⚡</span>
                  <div>
                    <p className="font-bold text-gray-900">BOB</p>
                    <p className="text-xs text-gray-500">Bug Out Bag - 72 horas de emergência</p>
                  </div>
                </button>
                <button
                  onClick={() => trocarMochila('BOLT')}
                  className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
                >
                  <span className="text-2xl">⛰️</span>
                  <div>
                    <p className="font-bold text-gray-900">BOLT</p>
                    <p className="text-xs text-gray-500">Bug Out Long Term - Autossuficiência</p>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowModalTroca(false)}
                className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Guia de Preparação da Mochila - Slides 1-7 (COMPLETO) */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
    <span className="text-2xl">📖</span> Guia de Preparação da Mochila
  </h2>
  
  <div className="space-y-6">
    {/* Slide 1 - Escola de Guerreiros */}
    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
      <p className="text-green-800 text-sm italic font-medium">
        "Não é possível treinar a técnica física para todas as situações da sua vida, 
        mas é possível treinar o estado mental para todas as situações. 
        A maior arma de todas é a mente humana."
      </p>
      <p className="text-green-600 text-xs mt-2">— Escola de Guerreiros</p>
    </div>

    {/* Slide 2 - Como escolher sua mochila */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">🎒</span> Como escolher sua mochila
      </h3>
      <p className="text-sm text-gray-600">
        Não existe mochila ideal que sirva para todo tipo de aventura, seja ela um trekking, 
        bushcraft, trilha na montanha ou acampamento.
      </p>
    </div>

    {/* Slide 3 - Características da mochila (COMPLETO) */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">✅</span> Características da mochila
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        De preferência por mochilas que tenham as alças largas com regulagem de altura e almofadadas 
        em todos os pontos de contato com o corpo, resistentes ou à prova d'água com cinto abdominal. 
        O cinto abdominal também é de suma importância já que por sua vez ajuda na distribuição do peso, 
        pois de nada vale você estar cheio de equipamentos, ser a pessoa mais preparada, e não conseguir 
        carregá-los de forma eficaz, pois numa trilha de 10 km na estrada é diferente de uma trilha de 
        10 km na mata fechada.
      </p>
    </div>

    {/* Slide 4 - Cuidados importantes (COMPLETO) */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">⚠️</span> Cuidados importantes
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Jamais carregue a mochila em um só ombro mesmo que seja apenas por um período curto de tempo, 
        isso gera um estresse desnecessário junto ao corpo já que o mesmo tende a corrigir o lado mais pesado. 
        Evite sobrecarregar os quadris e o joelho.
      </p>
    </div>

    {/* Slide 5 - Distribuição do peso (COMPLETO) */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">⚖️</span> Distribuição do peso
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Lembrando: menos peso = deslocamento mais rápido, mais peso = deslocamento mais longe. 
        A distribuição do peso de maneira uniforme é muito importante, é imprescindível redistribuir 
        o peso por igual na mochila, para que nem uma alça esteja forçando mais do que a outra, 
        pois no deslocamento longo isso influenciará diretamente na sua coluna, comprometendo assim 
        o seu rendimento. Uma mochila malfeita, mal preparada, mal balanceada pode acabar forçando 
        você na caminhada, caminhando torto você será forçado a compensar o peso extra.
      </p>
    </div>

    {/* Slide 6 - Peso ideal (COMPLETO) */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">📊</span> Peso ideal da mochila
      </h3>
      <p className="text-sm text-gray-600 mb-2">
        O ideal é que as alças da mochila fiquem com o mesmo ajuste de carga nos ombros.
      </p>
      <div className="bg-gray-50 p-3 rounded-lg mt-2">
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-2">
          <li><strong>Mulheres:</strong> até <span className="font-bold text-green-700">10%</span> do peso corporal</li>
          <li><strong>Homens:</strong> até <span className="font-bold text-green-700">15%</span> do peso corporal</li>
        </ul>
      </div>
    </div>

    {/* Slide 7 - Organização dos bolsos (COMPLETO) */}
    <div>
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">📦</span> Organização dos bolsos (fácil acesso)
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Na preparação da mochila, nos bolsos de fácil acesso deve se deixar tudo que poderá ou não 
        ser usado frequentemente, como:
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🩺 Kit primeiros socorros</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">💧 Garrafa de água</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🎣 Material de pesca</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">📝 Bloco para anotação</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">✍️ Caneta</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🔪 Faca</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🔥 Isqueiro</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🔦 Lanterna</span>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        📌 Tudo aquilo que você poderá precisar ao longo da jornada.
      </p>
    </div>
  </div>
</div>

        {/* Tipos de Mochila */}
        <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-blue-50 rounded-xl p-5 mb-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🎒</span> Qual tipo de mochila você está montando?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`bg-white rounded-lg p-4 border-2 ${mochilaTipo === 'EDC' ? 'border-green-500 shadow-md' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎒</span>
                <h3 className="font-bold text-green-700">EDC</h3>
                {mochilaTipo === 'EDC' && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Atual</span>}
              </div>
              <p className="text-xs text-gray-500 mb-1">Every Day Carry</p>
              <p className="text-sm text-gray-600">Itens para o dia a dia</p>
            </div>

            <div className={`bg-white rounded-lg p-4 border-2 ${mochilaTipo === 'BOB' ? 'border-yellow-500 shadow-md' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎒⚡</span>
                <h3 className="font-bold text-yellow-700">BOB</h3>
                {mochilaTipo === 'BOB' && <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">Atual</span>}
              </div>
              <p className="text-xs text-gray-500 mb-1">Bug Out Bag</p>
              <p className="text-sm text-gray-600">72 horas - emergência</p>
            </div>

            <div className={`bg-white rounded-lg p-4 border-2 ${mochilaTipo === 'BOLT' ? 'border-blue-500 shadow-md' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⛰️</span>
                <h3 className="font-bold text-blue-700">BOLT</h3>
                {mochilaTipo === 'BOLT' && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Atual</span>}
              </div>
              <p className="text-xs text-gray-500 mb-1">Bug Out Long Term</p>
              <p className="text-sm text-gray-600">Autossuficiência</p>
            </div>
          </div>
        </div>

        {/* Regra Defesa */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 mb-8 border border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">🛡️</span> Regra Defesa - Os 4 Pilares
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-2xl">💧</span>
              <p className="font-bold text-blue-600 text-sm">Água</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-2xl">🏠</span>
              <p className="font-bold text-green-600 text-sm">Abrigo</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-2xl">🍲</span>
              <p className="font-bold text-yellow-600 text-sm">Alimento</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-2xl">🔥</span>
              <p className="font-bold text-red-600 text-sm">Fogo</p>
            </div>
          </div>
        </div>

        {/* Kits Detalhados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Kits de Preparação</h2>
          
          <div className="space-y-3">
            {[
              { id: 'documentos', nome: 'Kit Documentos', icone: '📄', conteudo: [
  'Saco à prova d água (prata)',
  'Dinheiro físico (cédulas pequenas)',
  'Mapa da sua região',
  'Original ou cópia de todos os seus documentos',
  'Documentos dos seus dependentes',
  'Cópias em pendrive'
] },
              { id: 'agua', nome: 'Kit Água', icone: '💧', conteudo: [
  'Garrafa de água ou cantil (inox ou alumínio)',
  'Filtro de purificação',
  'Clorin, água sanitária ou iodo'
] },
             { id: 'abrigo', nome: 'Kit Abrigo', icone: '🏠', conteudo: [
  'Cobertor de alumínio',
  'Capa de chuva ou poncho',
  'Lona grossa',
  'Barraca',
  'Colchonete',
  'Rede armadeira'
] },
             { id: 'fogo', nome: 'Kit Fogo', icone: '🔥', conteudo: [
  'Fogareiro e gás',
  'Pederneira',
  'Isqueiro comum ou maçarico',
  'Algodão na vaselina',
  'Iniciador ou álcool',
  'Iscas de fogo'
] },
             { id: 'primeirosSocorros', nome: 'Kit Primeiros Socorros', icone: '🩺', conteudo: [
  'Remédios de uso contínuo',
  'Par de luvas',
  'Torniquete',
  'Traqueia',
  'Bandagem elástica',
  'Termômetro',
  'Toalhas de álcool',
  'Pinça',
  'Cortador',
  'Chás para resfriado',
  'Fio de sutura',
  'Lâmina de bisturi',
  'Colírio',
  'Tesoura sem ponta',
  'Repelente',
  'Protetor solar',
  'Esparadrapo',
  'Bandagem',
  'Gases',
  'Band-aid',
  'Algodão',
  'Pomada antisséptica',
  'Spray para dor muscular',
  'Analgésico dor muscular',
  'Cotonetes',
  'Toalhas moeda',
  'Absorventes',
  'Analgésico',
  'Dorflex',
  'Paracetamol',
  'Carvão ativado',
  'Pastilhas para garganta',
  'Hidraplex',
  'Fenaflan adesivo',
  'Hidratante labial',
  'Benegrip',
  'Spray anti-séptico',
  'Álcool gel',
  'Soro fisiológico',
  'Pomada Minâncora',
  'Iodo',
  'Alivium'
] },
              { id: 'higiene', nome: 'Kit Higiene', icone: '🧼', conteudo: [
  'Papel higiênico',
  'Lenços umedecidos',
  'Lenços de papel',
  'Cortador de unha',
  'Barbeador',
  'Pinça',
  'Alicate de cotícula',
  'Sabonete bactericida',
  'Creme dental (sem flúor)',
  'Escova pequena',
  'Cotonete',
  'Talco',
  'Pomada Minâncora',
  'Protetor solar',
  'Repelente'
] },
              { id: 'tecnologia', nome: 'Kit Tecnologia', icone: '📱', conteudo: [
  'Celular com carregadores',
  'Fones de ouvido',
  'Rádio comunicador',
  'Powerbank solar',
  'Lanterna de cabeça',
  'Lanterna a pilha',
  'Pilhas extras'
] },
              { id: 'ferramentas', nome: 'Kit Ferramentas', icone: '🔧', conteudo: [
  'Bússola',
  'Faca lâmina integral',
  'Canivete multifuncional',
  'Mosquetão 2700kg',
  'Paracord multifilamentos',
  'Afiador de faca',
  'Cintas plásticas',
  'Fita isolante',
  'Cola',
  'Apito',
  'Boné',
  'Binóculo',
  'Sinalizador laser',
  'Velas'
] },
              { id: 'alimentacao', nome: 'Kit Alimentação', icone: '🍲', conteudo: [
  'Caneca, faca, colher, garfo',
  'Água e comida (Tsampa)',
  'Café, sal, mel',
  'Enlatados'
] },
             { id: 'roupas', nome: 'Kit Roupas', icone: '👕', conteudo: [
  'Três pares de mudas de roupa completo',
  'Jaqueta à prova d água',
  'Camisa térmica',
  'Bota para trilha'
] },
{ id: 'limpeza', nome: 'Kit Limpeza de Equipamento', icone: '🧹', conteudo: [
  'Flanela branca',
  'Flanela escura',
  'Escova',
  'Cordão passador',
  'Óleo'
] },
{ id: 'pesca', nome: 'Kit Pesca', icone: '🎣', conteudo: [
  'Anzóis',
  'Chumbada',
  'Linha',
  'Boia',
  'Isca',
  'Empate',
  'Rede'
] },
{ id: 'costura', nome: 'Kit Costura', icone: '🪡', conteudo: [
  '2 botões',
  '2 agulhas',
  '1 carretel de linha',
  '2 joaninhas'
] },
{ id: 'variavel', nome: 'Kit Variável', icone: '🎒', conteudo: [
  'Bússola',
  'Faca lâmina integral',
  'Canivete',
  'Mosquetão',
  'Paracord',
  'Afiador de faca',
  'Cintas plásticas',
  'Fita isolante',
  'Apito',
  'Boné',
  'Binóculo',
  'Lanterna de cabeça',
  'Lanterna a pilha',
  'Pilhas extras',
  'Sacos BGS impermeável',
  'Caneta e bloco para anotações',
  'Sinalizador laser',
  'Velas'
] },
            ].map((kit) => (
              <div key={kit.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleKit(kit.id)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{kit.icone}</span>
                    <span className="font-semibold">{kit.nome}</span>
                  </div>
                  <span className="text-gray-400">{kitsAbertos[kit.id] ? '▲' : '▼'}</span>
                </button>
                {kitsAbertos[kit.id] && (
                  <div className="p-4 bg-white border-t border-gray-100">
                    <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                      {kit.conteudo.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
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

        {/* Categorias do Checklist */}
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