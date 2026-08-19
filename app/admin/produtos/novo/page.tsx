'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'

interface ProductForm {
  name: string
  description: string | null
  price: number
  category: string
  stock: number
  image_url: string
  images: string[]
  mochila_tipo: string[]
  is_active: boolean
  is_digital: boolean
  free_shipping: boolean
  file_url: string | null
}

const CATEGORIAS = [
  { value: '', label: 'Selecione uma categoria' },
  { value: 'mochilas', label: 'Mochilas' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'e-books', label: 'E-books' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'hidratacao', label: 'Hidratação' },
  { value: 'primeiros_socorros', label: 'Primeiros Socorros' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'iluminacao', label: 'Iluminação' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'navegacao', label: 'Navegação' },
  { value: 'abrigo', label: 'Abrigo' },
  { value: 'vestuario', label: 'Vestuário' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'dinheiro', label: 'Dinheiro/Cartões' },
  { value: 'outros', label: 'Outros' },
]

export default function NovoProdutoAdmin() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    image_url: '',
    images: [],
    mochila_tipo: [],
    is_active: true,
    is_digital: false,
    free_shipping: false,
    file_url: null,
  })
  const [mochilaOptions] = useState(['EDC', 'BOB', 'BOLT'])
  const router = useRouter()
  const STORAGE_BUCKET = 'produtos'

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/dashboard')
      }
    }

    checkAdmin()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    const categoria = CATEGORIAS.find(c => c.value === selectedValue)
    setFormData(prev => ({
      ...prev,
      category: categoria ? categoria.label : selectedValue
    }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleMochilaTipo = (tipo: string) => {
    setFormData(prev => {
      const current = prev.mochila_tipo || []
      if (current.includes(tipo)) {
        return { ...prev, mochila_tipo: current.filter(t => t !== tipo) }
      } else {
        return { ...prev, mochila_tipo: [...current, tipo] }
      }
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    // 🔥 LIMITE DE 20 IMAGENS
    if (formData.images.length >= 20) {
      alert('Limite máximo de 20 imagens atingido')
      return
    }

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)

      setFormData(prev => ({
        ...prev,
        image_url: urlData.publicUrl,
        images: [...(prev.images || []), urlData.publicUrl]
      }))
      
      alert('✅ Imagem enviada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(`Erro ao fazer upload: ${error.message || 'Tente novamente'}`)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }))
    // Se remover a imagem principal, atualizar image_url
    if (index === 0 && formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        image_url: prev.images[1] || ''
      }))
    } else if (formData.images.length === 1) {
      setFormData(prev => ({
        ...prev,
        image_url: ''
      }))
    }
  }

  const getSelectedValue = () => {
    if (!formData.category) return ''
    const categoria = CATEGORIAS.find(c => c.label === formData.category)
    return categoria ? categoria.value : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase
        .from('products') as any)
        .insert([{
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category: formData.category,
          stock: formData.stock,
          image_url: formData.image_url,
          images: formData.images || [],
          mochila_tipo: formData.mochila_tipo || [],
          is_active: formData.is_active,
          is_digital: formData.is_digital,
          free_shipping: formData.free_shipping,
          file_url: formData.file_url || null,
        }])

      if (error) throw error

      alert('✅ Produto criado com sucesso!')
      router.push('/admin/produtos')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      alert('Erro ao criar produto: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/produtos"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Novo Produto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Ex: Mochila Tática"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Descrição detalhada do produto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              name="category"
              value={getSelectedValue()}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mochila
            </label>
            <div className="flex gap-3 flex-wrap">
              {mochilaOptions.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleMochilaTipo(tipo)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    (formData.mochila_tipo || []).includes(tipo)
                      ? 'border-[#FFB800] bg-[#FFB800]/10 text-black'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckbox}
                className="w-4 h-4 text-[#FFB800] focus:ring-[#FFB800]"
              />
              <span className="text-sm text-gray-700">Produto ativo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_digital"
                checked={formData.is_digital}
                onChange={handleCheckbox}
                className="w-4 h-4 text-[#FFB800] focus:ring-[#FFB800]"
              />
              <span className="text-sm text-gray-700">Produto digital (e-book)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="free_shipping"
                checked={formData.free_shipping}
                onChange={handleCheckbox}
                className="w-4 h-4 text-[#FFB800] focus:ring-[#FFB800]"
              />
              <span className="text-sm text-gray-700">Frete grátis</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Produto (até 20)
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="cursor-pointer">
                <div className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Upload size={18} />
                  <span className="text-sm">{uploading ? 'Enviando...' : 'Adicionar imagem'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading || formData.images.length >= 20}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-400">
                {formData.images.length}/20 imagens
              </span>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-[#FFB800] text-black text-[0.5rem] font-bold px-1.5 py-0.5 rounded">
                        PRINCIPAL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Formatos aceitos: JPG, PNG, WebP. Máximo 5MB por imagem.
              A primeira imagem é a principal.
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Produto'}
            </button>
            <Link
              href="/admin/produtos"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
