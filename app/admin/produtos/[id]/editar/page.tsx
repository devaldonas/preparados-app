'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { ArrowLeft, Save, Image, X, Upload } from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image_url: string
  images: string[]
  is_active: boolean
  free_shipping: boolean
}

function EditarProdutoContent({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: '',
    is_active: true,
    free_shipping: false,
    images: ['']
  })
  const router = useRouter()

  useEffect(() => {
    const carregarProduto = async () => {
      try {
        const { id } = await params
        const productId = parseInt(id)

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        
        setProduct(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          category: data.category || '',
          stock: data.stock?.toString() || '',
          image_url: data.image_url || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
          free_shipping: data.free_shipping || false,
          images: data.images && data.images.length > 0 ? data.images : ['']
        })

      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        router.push('/admin/produtos')
      } finally {
        setLoading(false)
      }
    }

    carregarProduto()
  }, [params, router])

  // 🔥 LISTA DE CATEGORIAS - COM E-BOOKS E HIDRATAÇÃO
  const categorias = [
    'Abrigo',
    'Água',
    'Alimentação',
    'Documentos',
    'E-books',
    'Equipamentos',
    'Ferramentas',
    'Fogo',
    'Higiene',
    'Hidratação',
    'Iluminação',
    'Kits',
    'Mochilas',
    'Primeiros Socorros',
    'Roupas',
    'Tecnologia'
  ]

  const uploadImage = async (file: File, index?: number) => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `produtos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(filePath)

      if (index !== undefined) {
        const newImages = [...formData.images]
        newImages[index] = publicUrl
        setFormData(prev => ({ ...prev, images: newImages }))
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, publicUrl]
        }))
      }

      return publicUrl

    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem')
      return null
    } finally {
      setUploading(false)
    }
  }

  const uploadMainImage = async (file: File) => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `produtos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      return publicUrl

    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem principal')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { id } = await params
      const productId = parseInt(id)

      const imagensFiltradas = formData.images.filter(img => img.trim() !== '')

      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        image_url: formData.image_url,
        is_active: formData.is_active,
        free_shipping: formData.free_shipping,
        images: imagensFiltradas,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (error) throw error

      alert('Produto atualizado com sucesso!')
      router.push(`/admin/produtos/${productId}`)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }))
  }

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Produto não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="mb-6">
          <Link
            href={`/admin/produtos/${product.id}`}
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            <ArrowLeft size={18} />
            Voltar para Detalhes
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-black mb-6">Editar Produto</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem Principal
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <Upload size={18} />
                  Escolher arquivo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadMainImage(file)
                    }}
                  />
                </label>
                {uploading && <span className="text-sm text-gray-500">Enviando...</span>}
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagens Adicionais
              </label>
              {formData.images.map((img, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm">
                      <Upload size={16} />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadImage(file, index)
                        }}
                      />
                    </label>
                    {img && (
                      <div className="flex-shrink-0 w-12 h-12">
                        <img
                          src={img}
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="text-sm text-[#FFB800] hover:underline flex items-center gap-1"
              >
                <Image size={16} />
                Adicionar imagem
              </button>
              {uploading && <span className="text-sm text-gray-500 ml-2">Enviando...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#FFB800] rounded border-gray-300 focus:ring-[#FFB800]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Produto Ativo
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="free_shipping"
                  checked={formData.free_shipping}
                  onChange={(e) => setFormData({ ...formData, free_shipping: e.target.checked })}
                  className="w-4 h-4 text-[#FFB800] rounded border-gray-300 focus:ring-[#FFB800]"
                />
                <label htmlFor="free_shipping" className="text-sm font-medium text-gray-700">
                  Frete Grátis
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <Link
                href={`/admin/produtos/${product.id}`}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminGuard>
      <EditarProdutoContent params={params} />
    </AdminGuard>
  )
}
