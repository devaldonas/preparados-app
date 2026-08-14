'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Upload } from 'lucide-react'

// Categorias disponíveis
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

export default function EditarProdutoParceiro({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [produto, setProduto] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    image_url: '',
    mochila_tipo: [] as string[],
    is_active: true,
    is_digital: false,
    free_shipping: false,
  })
  const [mochilaOptions] = useState(['EDC', 'BOB', 'BOLT'])
  const router = useRouter()
  const STORAGE_BUCKET = 'produtos'

  useEffect(() => {
    const carregarProduto = async () => {
      try {
        const resolvedParams = await params
        const productId = resolvedParams.id

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Buscar o ID do parceiro
        const { data: partner } = await (supabase
          .from('partners') as any)
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!partner) {
          router.push('/parceiro')
          return
        }

        // Buscar o produto
        const { data: product, error } = await (supabase
          .from('products') as any)
          .select('*')
          .eq('id', parseInt(productId))
          .eq('partner_id', partner.id)
          .single()

        if (error || !product) {
          console.error('Produto não encontrado:', error)
          router.push('/parceiro/produtos')
          return
        }

        setProduto(product)
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          category: product.category || '',
          stock: product.stock || 0,
          image_url: product.image_url || '',
          mochila_tipo: product.mochila_tipo || [],
          is_active: product.is_active !== undefined ? product.is_active : true,
          is_digital: product.is_digital || false,
          free_shipping: product.free_shipping || false,
        })
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        router.push('/parceiro/produtos')
      } finally {
        setLoading(false)
      }
    }

    carregarProduto()
  }, [params])

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

  const getSelectedValue = () => {
    if (!formData.category) return ''
    const categoria = CATEGORIAS.find(c => c.label === formData.category)
    return categoria ? categoria.value : ''
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
        image_url: urlData.publicUrl
      }))
      
      alert('✅ Imagem enviada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(`Erro ao fazer upload: ${error.message || 'Tente novamente'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await (supabase
        .from('products') as any)
        .update({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category: formData.category,
          stock: formData.stock,
          image_url: formData.image_url,
          mochila_tipo: formData.mochila_tipo || [],
          is_active: formData.is_active,
          is_digital: formData.is_digital,
          free_shipping: formData.free_shipping,
          updated_at: new Date().toISOString()
        })
        .eq('id', produto.id)

      if (error) throw error

      alert('✅ Produto atualizado com sucesso!')
      router.push('/parceiro/produtos')
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto')
    } finally {
      setSaving(false)
    }
  }

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
            href="/parceiro/produtos"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Editar Produto</h1>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
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
              Imagem do Produto
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <div className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Upload size={18} />
                  <span className="text-sm">{uploading ? 'Enviando...' : 'Trocar imagem'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {formData.image_url && (
                <div className="relative w-16 h-16">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Formatos aceitos: JPG, PNG, WebP. Máximo 5MB.
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <Link
              href="/parceiro/produtos"
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
