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
    alimentacao: false,
    roupas: false,
    limpeza: false,
    pesca: false,
    costura: false,
    variavel: false,
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
    { name: 'Documentos', icon: '/images/documentos.jpeg', order: 1 },
    { name: 'Água', icon: '/images/agua.jpeg', order: 2 },
    { name: 'Abrigo', icon: '/images/abrigo.jpeg', order: 3 },
    { name: 'Fogo', icon: '/images/fogo.jpeg', order: 4 },
    { name: 'Primeiros Socorros', icon: '/images/socorro.jpeg', order: 5 },
    { name: 'Higiene', icon: '/images/higiene.jpeg', order: 6 },
    { name: 'Tecnologia', icon: '/images/tecnologia.jpeg', order: 7 },
    { name: 'Ferramentas', icon: '/images/equipamentos.jpeg', order: 8 },
    { name: 'Alimentação', icon: '/images/alimento.jpeg', order: 9 },
    { name: 'Roupas', icon: '/images/roupas.jpeg', order: 10 },
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
      {/* Header - apenas título e ícone */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-3 mb-2">
          <img 
            src="/images/mochila-icon.png" 
            alt="Minha Mochila" 
            className="h-16 w-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <h1 className="text-3xl font-bold text-black">MINHA MOCHILA</h1>
        </div>
        <p className="text-gray-400 italic">
          {mochilaTipo === 'EDC' && 'Every Day Carry - Itens para o dia a dia'}
          {mochilaTipo === 'BOB' && 'Bug Out Bag - 72 horas de emergência'}
          {mochilaTipo === 'BOLT' && 'Bug Out Long Term - Autossuficiência'}
        </p>
      </div>

      {/* Card do tipo de mochila com botão */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Tipo de mochila atual</span>
            <h2 className="text-xl font-bold text-[#FFB800] mt-1">
              {mochilaTipo === 'EDC' && 'EDC - Dia a Dia'}
              {mochilaTipo === 'BOB' && 'BOB - 72 horas'}
              {mochilaTipo === 'BOLT' && 'BOLT - Autossuficiência'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mochilaTipo === 'EDC' && 'Itens essenciais para o dia a dia, que você já carrega na bolsa ou mochila comum.'}
              {mochilaTipo === 'BOB' && 'Mochila preparada para 72 horas de emergência, com itens de sobrevivência básica.'}
              {mochilaTipo === 'BOLT' && 'Kit completo para situações prolongadas, com equipamentos mais robustos.'}
            </p>
          </div>
          <button
  onClick={() => setShowModalTroca(true)}
  disabled={trocando}
  className="bg-[#FFB800] text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#E5A600] transition flex items-center gap-2 whitespace-nowrap"
>
  <img 
    src="/images/botaoatualizar.png" 
    alt="Atualizar" 
    className="w-4 h-4 object-contain"
    onError={(e) => {
      e.currentTarget.style.display = 'none'
    }}
  />
  Trocar Mochila
</button>
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

        {/* Modal de Troca de Mochila */}
{showModalTroca && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Escolha seu tipo de mochila</h2>
      <p className="text-sm text-gray-600 mb-6">
        Selecione o tipo de mochila que melhor se adapta à sua necessidade:
      </p>
      <div className="space-y-3">
        {/* EDC */}
        <button
          onClick={() => trocarMochila('EDC')}
          className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
        >
          <img 
            src="/images/mochila-icon.png" 
            alt="EDC" 
            className="w-6 h-6 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <p className="font-bold text-gray-900">EDC</p>
            <p className="text-xs text-gray-500">Every Day Carry - Itens para o dia a dia</p>
          </div>
        </button>
        
        {/* BOB */}
        <button
          onClick={() => trocarMochila('BOB')}
          className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
        >
          <img 
            src="/images/mochila-icon.png" 
            alt="BOB" 
            className="w-6 h-6 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <p className="font-bold text-gray-900">BOB</p>
            <p className="text-xs text-gray-500">Bug Out Bag - 72 horas de emergência</p>
          </div>
        </button>
        
        {/* BOLT */}
        <button
          onClick={() => trocarMochila('BOLT')}
          className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition flex items-center gap-3"
        >
          <img 
            src="/images/mochila-icon.png" 
            alt="BOLT" 
            className="w-6 h-6 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
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

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
    <span className="text-2xl"></span> Guia de Preparação da Mochila
  </h2>
  
  <div className="space-y-6">
    {/* Slide 1 - Escola de Guerreiros */}
    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#FFB800]">
      <p className="text-gray-700 text-sm italic font-medium">
        "Não é possível treinar a técnica física para todas as situações da sua vida, 
        mas é possível treinar o estado mental para todas as situações. 
        A maior arma de todas é a mente humana."
      </p>
      <p className="text-gray-500 text-xs mt-2">— Escola de Guerreiros</p>
    </div>

    {/* Slide 2 - Como escolher sua mochila */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg"></span> Como escolher sua mochila
      </h3>
      <p className="text-sm text-gray-600">
        Não existe mochila ideal que sirva para todo tipo de aventura...
      </p>
    </div>

    {/* Slide 3 - Características da mochila */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">✅</span> Características da mochila
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        De preferência por mochilas que tenham as alças largas com regulagem de altura e almofadadas 
        em todos os pontos de contato com o corpo, resistentes ou à prova d'água com cinto abdominal. 
        O cinto abdominal também é de suma importância já que por sua vez ajuda na distribuição do peso...
      </p>
    </div>

    {/* Slide 4 - Cuidados importantes */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">⚠️</span> Cuidados importantes
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Jamais carregue a mochila em um só ombro mesmo que seja apenas por um período curto de tempo, 
        isso gera um estresse desnecessário junto ao corpo...
      </p>
    </div>

    {/* Slide 5 - Distribuição do peso */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg">⚖️</span> Distribuição do peso
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Lembrando: menos peso = deslocamento mais rápido, mais peso = deslocamento mais longe. 
        A distribuição do peso de maneira uniforme é muito importante...
      </p>
    </div>

    {/* Slide 6 - Peso ideal */}
    <div className="border-b border-gray-100 pb-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-lg"></span> Peso ideal da mochila
      </h3>
      <p className="text-sm text-gray-600 mb-2">
        O ideal é que as alças da mochila fiquem com o mesmo ajuste de carga nos ombros.
      </p>
      <div className="bg-gray-50 p-3 rounded-lg mt-2">
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-2">
          <li><strong>Mulheres:</strong> até <span className="font-bold text-green-600">10%</span> do peso corporal</li>
          <li><strong>Homens:</strong> até <span className="font-bold text-green-600">15%</span> do peso corporal</li>
        </ul>
      </div>
    </div>

    {/* Slide 7 - Organização dos bolsos */}
    <div>
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <img src="/images/equipamentos.jpeg" alt="Organização" className="w-5 h-5 object-contain" />
        Organização dos bolsos (fácil acesso)
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Na preparação da mochila, nos bolsos de fácil acesso deve se deixar tudo que poderá ou não 
        ser usado frequentemente, como:
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Kit primeiros socorros</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Garrafa de água</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Material de pesca</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Bloco para anotação</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Caneta</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Faca</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Isqueiro</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Lanterna</span>
      </div>
      <p className="text-xs text-gray-500 mt-3">
         Tudo aquilo que você poderá precisar ao longo da jornada.
      </p>
    </div>
  </div>
</div>

{/* Tipos de Mochila */}
<div className="bg-white rounded-xl p-5 mb-8 border border-gray-100">
  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
    <img src="/images/mochila-icon.png" alt="Mochila" className="w-6 h-6 object-contain" />
    Qual tipo de mochila você está montando?
  </h2>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className={`bg-gray-50 rounded-lg p-4 border-2 ${mochilaTipo === 'EDC' ? 'border-[#FFB800] shadow-md' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <img src="/images/mochila-icon.png" alt="EDC" className="w-6 h-6 object-contain" />
        <h3 className="font-bold text-gray-900">EDC</h3>
        {mochilaTipo === 'EDC' && <span className="text-xs bg-[#FFB800] text-black px-2 py-0.5 rounded-full">Atual</span>}
      </div>
      <p className="text-xs text-gray-500 mb-1">Every Day Carry</p>
      <p className="text-sm text-gray-600">Itens para o dia a dia</p>
    </div>

    <div className={`bg-gray-50 rounded-lg p-4 border-2 ${mochilaTipo === 'BOB' ? 'border-[#FFB800] shadow-md' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <img src="/images/mochila-icon.png" alt="BOB" className="w-6 h-6 object-contain" />
        <h3 className="font-bold text-gray-900">BOB</h3>
        {mochilaTipo === 'BOB' && <span className="text-xs bg-[#FFB800] text-black px-2 py-0.5 rounded-full">Atual</span>}
      </div>
      <p className="text-xs text-gray-500 mb-1">Bug Out Bag</p>
      <p className="text-sm text-gray-600">72 horas - emergência</p>
    </div>

    <div className={`bg-gray-50 rounded-lg p-4 border-2 ${mochilaTipo === 'BOLT' ? 'border-[#FFB800] shadow-md' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <img src="/images/mochila-icon.png" alt="BOB" className="w-6 h-6 object-contain" />
        <h3 className="font-bold text-gray-900">BOLT</h3>
        {mochilaTipo === 'BOLT' && <span className="text-xs bg-[#FFB800] text-black px-2 py-0.5 rounded-full">Atual</span>}
      </div>
      <p className="text-xs text-gray-500 mb-1">Bug Out Long Term</p>
      <p className="text-sm text-gray-600">Autossuficiência</p>
    </div>
  </div>
</div>

{/* Regra Defesa - Pilares da Preparação */}
<div className="bg-white rounded-xl p-5 mb-8 border border-gray-100">
  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
    <img src="/images/defesa.jpeg" alt="Defesa" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
    Pilares da Preparação
  </h2>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <img src="/images/logo.jpeg" alt="Defesa" className="w-10 h-10 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <p className="font-bold text-gray-900 text-sm">Defesa</p>
      <p className="text-xs text-gray-500">Atitude mental</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <img src="/images/agua.jpeg" alt="Água" className="w-10 h-10 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <p className="font-bold text-gray-900 text-sm">Água</p>
      <p className="text-xs text-gray-500">Hidratação</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <img src="/images/abrigo.jpeg" alt="Abrigo" className="w-10 h-10 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <p className="font-bold text-gray-900 text-sm">Abrigo</p>
      <p className="text-xs text-gray-500">Proteção</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <img src="/images/alimento.jpeg" alt="Alimento" className="w-10 h-10 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <p className="font-bold text-gray-900 text-sm">Alimento</p>
      <p className="text-xs text-gray-500">Energia</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <img src="/images/fogo.jpeg" alt="Fogo" className="w-10 h-10 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <p className="font-bold text-gray-900 text-sm">Fogo</p>
      <p className="text-xs text-gray-500">Calor e preparo</p>
    </div>
  </div>
  <p className="text-xs text-center text-gray-500 mt-3">
     A Defesa é o primeiro pilar: esteja mentalmente preparado para qualquer situação.
  </p>
</div>

{/* Kits Detalhados */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
  <h2 className="text-xl font-bold text-gray-900 mb-4"> Kits de Preparação</h2>
    
  <div className="space-y-3">
    {[
      { id: 'documentos', nome: 'Kit Documentos', icone: '/images/documentos.jpeg', conteudo: [
        'Saco à prova d água ',
        'Dinheiro físico (cédulas pequenas, prata)',
        'Mapa da sua região',
        'Original ou cópia de todos os seus documentos',
        'Documentos dos seus dependentes',
        'Cópias em pendrive'
      ] },
      { id: 'agua', nome: 'Kit Água', icone: '/images/agua.jpeg', conteudo: [
        'Garrafa de água ou cantil (inox ou alumínio)',
        'Filtro de purificação',
        'Clorin, água sanitária ou iodo'
      ] },
      { id: 'abrigo', nome: 'Kit Abrigo', icone: '/images/abrigo.jpeg', conteudo: [
        'Cobertor de alumínio',
        'Capa de chuva ou poncho',
        'Lona grossa',
        'Barraca',
        'Colchonete',
        'Rede armadeira'
      ] },
      { id: 'fogo', nome: 'Kit Fogo', icone: '/images/fogo.jpeg', conteudo: [
        'Fogareiro e gás',
        'Pederneira',
        'Isqueiro comum ou maçarico',
        'Algodão na vaselina',
        'Iniciador ou álcool',
        'Iscas de fogo'
      ] },
      { id: 'primeirosSocorros', nome: 'Kit Primeiros Socorros', icone: '/images/socorro.jpeg', conteudo: [
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
      { id: 'higiene', nome: 'Kit Higiene', icone: '/images/higiene.jpeg', conteudo: [
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
      { id: 'tecnologia', nome: 'Kit Tecnologia', icone: '/images/tecnologia.jpeg', conteudo: [
        'Celular com carregadores',
        'Fones de ouvido',
        'Rádio comunicador',
        'Powerbank solar',
        'Lanterna de cabeça',
        'Lanterna a pilha',
        'Pilhas extras'
      ] },
      { id: 'alimentacao', nome: 'Kit Alimentação', icone: '/images/alimento.jpeg', conteudo: [
        'Caneca, faca, colher, garfo',
        'Água e comida (Tsampa)',
        'Café, sal, mel',
        'Enlatados'
      ] },
      { id: 'roupas', nome: 'Kit Roupas', icone: '/images/roupas.jpeg', conteudo: [
        'Três pares de mudas de roupa completo',
        'Jaqueta à prova d água',
        'Camisa térmica',
        'Bota para trilha'
      ] },
      { id: 'limpeza', nome: 'Kit Limpeza', icone: '/images/equipamentos.jpeg', conteudo: [
        'Flanela branca',
        'Flanela escura',
        'Escova',
        'Cordão passador',
        'Óleo'
      ] },
      { id: 'pesca', nome: 'Kit Pesca', icone: '/images/equipamentos.jpeg', conteudo: [
        'Anzóis',
        'Chumbada',
        'Linha',
        'Boia',
        'Isca',
        'Empate',
        'Rede'
      ] },
      { id: 'costura', nome: 'Kit Costura', icone: '/images/equipamentos.jpeg', conteudo: [
        '2 botões',
        '2 agulhas',
        '1 carretel de linha',
        '2 joaninhas'
      ] },
      { id: 'variavel', nome: 'Kit Variável', icone: '/images/equipamentos.jpeg', conteudo: [
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
      <div key={kit.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <button onClick={() => toggleKit(kit.id)} className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src={kit.icone} alt={kit.nome} className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="font-semibold text-gray-900">{kit.nome}</span>
          </div>
          <span className="text-gray-500">{kitsAbertos[kit.id] ? '▲' : '▼'}</span>
        </button>
        {kitsAbertos[kit.id] && (
          <div className="p-4 bg-white border-t border-gray-100">
            <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
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
              {/* Ícone da categoria - substituído o emoji */}
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