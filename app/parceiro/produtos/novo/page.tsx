// app/parceiro/produtos/novo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
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

export default function NovoProdutoParceiro() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [partner, setPartner] = useState<any>(null)
  const [partnerLoading, setPartnerLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()

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

  const mochilaOptions = ['EDC', 'BOB', 'BOLT']

  useEffect(() => {
    const carregarParceiro = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // 🔥 CORRIGIDO: buscar parceiro com as any
        const { data: partnerData, error: partnerError } = await (supabase
          .from('partners') as any)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (partnerError || !partnerData) {
          router.push('/parceiro/cadastro')
          return
        }

        if (partnerData.status !== 'approved') {
          router.push('/parceiro/aguardando-aprovacao')
          return
        }

        setPartner(partnerData)
      } catch (error) {
        console.error('Erro ao carregar parceiro:', error)
        router.push('/parceiro/dashboard')
      } finally {
        setPartnerLoading(false)
      }
    }

    carregarParceiro()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
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

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await (supabase
        .storage
        .from('products') as any)
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = (supabase
        .storage
        .from('products') as any)
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      setImageUrls(prev => [...prev, publicUrl])
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
        images: [...prev.images, publicUrl]
      }))
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      image_url: prev.images.length > 1 ? prev.images[0] : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!partner) {
        alert('Parceiro não encontrado')
        setLoading(false)
        return
      }

      // 🔥 CORRIGIDO: usar partner.id com segurança
      const partnerId = partner.id

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        category: formData.category,
        stock: formData.stock,
        image_url: formData.image_url,
        images: imageUrls,
        mochila_tipo: formData.mochila_tipo || [],
        partner_id: partnerId,
        is_active: true,
        is_digital: formData.is_digital || false,
        free_shipping: formData.free_shipping || false,
        file_url: formData.file_url || null,
      }

      // 🔥 CORRIGIDO: inserir com as any
      const { error } = await (supabase
        .from('products') as any)
        .insert([productData])

      if (error) throw error

      alert('Produto criado com sucesso!')
      router.push('/parceiro/produtos')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      alert('Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/parceiro/produtos" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/parceiro/produtos"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Novo Produto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Nome */}
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

          {/* Descrição */}
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

          {/* Preço e Estoque */}
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

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            >
              <option value="">Selecione uma categoria</option>
              <option value="mochilas">Mochilas</option>
              <option value="acessorios">Acessórios</option>
              <option value="equipamentos">Equipamentos</option>
              <option value="e-books">E-books</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Tipo de Mochila */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mochila
            </label>
            <div className="flex gap-3">
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

          {/* Checkboxes */}
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

          {/* Upload de Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem do Produto
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="cursor-pointer">
                <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2">
                  <Upload size={18} />
                  <span className="text-sm">{uploading ? 'Enviando...' : 'Escolher imagem'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <div className="flex gap-2 flex-wrap">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative w-16 h-16">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Produto'}
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