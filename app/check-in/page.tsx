'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function CheckIn() {
  const [user, setUser] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Perguntas do check-in baseadas no material do Michel
  const questions = [
    {
      id: 'mochila',
      text: 'Você tem uma mochila de emergência?',
      options: [
        { value: 'sim', label: 'Sim', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'nao', label: 'Não', score: 0 },
      ],
    },
    {
      id: 'peso_ideal',
      text: 'Sabe o peso ideal da sua mochila? (10% mulheres / 15% homens)',
      options: [
        { value: 'sim', label: 'Sim', score: 10 },
        { value: 'nao', label: 'Não', score: 0 },
      ],
    },
    {
      id: 'agua',
      text: 'Como está sua preparação para ÁGUA? (filtro, cloro, cantil)',
      options: [
        { value: 'bom', label: 'Bom', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'ruim', label: 'Ruim', score: 0 },
      ],
    },
    {
      id: 'abrigo',
      text: 'Como está sua preparação para ABRIGO? (cobertor, capa, barraca)',
      options: [
        { value: 'bom', label: 'Bom', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'ruim', label: 'Ruim', score: 0 },
      ],
    },
    {
      id: 'alimento',
      text: 'Como está sua preparação para ALIMENTO? (suprimentos para 72h)',
      options: [
        { value: 'bom', label: 'Bom', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'ruim', label: 'Ruim', score: 0 },
      ],
    },
    {
      id: 'fogo',
      text: 'Como está sua preparação para FOGO? (isqueiro, pederneira)',
      options: [
        { value: 'bom', label: 'Bom', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'ruim', label: 'Ruim', score: 0 },
      ],
    },
    {
      id: 'documentos',
      text: 'Você tem cópias dos seus documentos importantes na mochila?',
      options: [
        { value: 'sim', label: 'Sim', score: 10 },
        { value: 'nao', label: 'Não', score: 0 },
      ],
    },
    {
      id: 'dinheiro',
      text: 'Você tem dinheiro físico (cédulas pequenas) reservado?',
      options: [
        { value: 'sim', label: 'Sim', score: 10 },
        { value: 'nao', label: 'Não', score: 0 },
      ],
    },
    {
      id: 'primeiros_socorros',
      text: 'Você tem kit de primeiros socorros completo?',
      options: [
        { value: 'sim', label: 'Sim', score: 10 },
        { value: 'parcial', label: 'Parcial', score: 5 },
        { value: 'nao', label: 'Não', score: 0 },
      ],
    },
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await loadPreviousAnswers(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadPreviousAnswers = async (userId: string) => {
    const { data } = await supabase
      .from('checkin_answers')
      .select('question, answer, score')
      .eq('user_id', userId)

    if (data && data.length > 0) {
      const savedAnswers: Record<string, any> = {}
      data.forEach((item) => {
        savedAnswers[item.question] = { value: item.answer, score: item.score }
      })
      setAnswers(savedAnswers)
    }
  }

  const handleAnswer = (questionId: string, value: string, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { value, score },
    }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      saveAnswers()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveAnswers = async () => {
    if (!user) return

    setSaving(true)
    setLoading(true)

    const { data: existing } = await supabase
      .from('checkin_answers')
      .select('id')
      .eq('user_id', user.id)

    if (existing && existing.length > 0) {
      await supabase
        .from('checkin_answers')
        .delete()
        .eq('user_id', user.id)
    }

    const answersToSave = Object.entries(answers).map(([questionId, data]: [string, any]) => ({
      user_id: user.id,
      question: questionId,
      answer: data.value,
      score: data.score,
    }))

    const { error } = await supabase
      .from('checkin_answers')
      .insert(answersToSave)

    if (error) {
      console.error('Erro ao salvar:', error)
    } else {
      const totalScore = Object.values(answers).reduce((acc: number, curr: any) => acc + curr.score, 0)
      const maxScore = questions.reduce((acc, q) => acc + (q.options[0]?.score || 0), 0)
      const percentage = Math.round((totalScore / maxScore) * 100)
      
      router.push(`/check-in/resultado?score=${totalScore}&max=${maxScore}&percentage=${percentage}`)
    }

    setSaving(false)
    setLoading(false)
  }

  const currentQuestion = questions[currentStep]
  const currentAnswer = answers[currentQuestion?.id]?.value || ''
  const progress = ((currentStep + 1) / questions.length) * 100

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">CHECK-IN</h1>
          <p className="text-gray-600">Descubra seu nível de preparação</p>
        </div>

        {/* Progress Bar - Amarela */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Questão {currentStep + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#FFB800] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition ${
                  currentAnswer === option.value
                    ? 'border-2 border-black bg-gray-100'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={currentAnswer === option.value}
                  onChange={() => handleAnswer(currentQuestion.id, option.value, option.score)}
                  className="w-4 h-4 text-black focus:ring-black"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!currentAnswer || loading}
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition ${
              !currentAnswer || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#FFB800] text-black hover:bg-[#E5A600]'
            }`}
          >
            {currentStep === questions.length - 1 
              ? (saving ? 'Salvando...' : 'Finalizar') 
              : 'Próxima'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Baseado nos princípios da Escola de Guerreiros
        </p>
      </div>
    </div>
  )
}