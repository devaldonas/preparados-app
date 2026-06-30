// app/parceiro/produtos/editar/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import UploadMultiplasImagens from '@/components/UploadMultiplasImagens'
import { ArrowLeft, Loader2, AlertCircle, Check, Save } from 'lucide-react'

export default function EditarProdutoParceiro() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [partner, setPartner] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    mochila_tipo: [] as string[]
  })

  const categories = [
    'Mochilas',
    'Acessorios',
    'Alimentacao',
    'Primeiros Socorros',
    'Ferramentas',
    'Tecnologia'
  ]

  const mochilaTipos = ['EDC', 'BOB', 'BOLT']

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar parceiro
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (partnerError || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)

      // Buscar produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('partner_id', partnerData.id)
        .single()

      if (productError || !product) {
        setError('Produto não encontrado')
        setLoading(false)
        return
      }

      setFormData({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        category: product.category,
        stock: String(product.stock),
        mochila_tipo: product.mochila_tipo || []
      })

      setImageUrls(product.images || (product.image_url ? [product.image_url] : []))

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTipoChange = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      mochila_tipo: prev.mochila_tipo.includes(tipo)
        ? prev.mochila_tipo.filter(t => t !== tipo)
        : [...prev.mochila_tipo, tipo]
    }))
  }

  const handleUploadComplete = (urls: string[]) => {
    setImageUrls(urls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!formData.name || !formData.price || !formData.category) {
      setError('Preencha todos os campos obrigatórios')
      setSaving(false)
      return
    }

    if (imageUrls.length === 0) {
      setError('Adicione pelo menos uma imagem do produto')
      setSaving(false)
      return
    }

    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        image_url: imageUrls[0],
        images: imageUrls,
        mochila_tipo: formData.mochila_tipo,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('partner_id', partner.id)

      if (updateError) {
        console.error('Erro ao atualizar produto:', updateError)
        setError('Erro ao atualizar produto. Tente novamente.')
        setSaving(false)
        return
      }

      setSuccess('Produto atualizado com sucesso!')
      setTimeout(() => {
        router.push('/parceiro/produtos')
      }, 2000)

    } catch (error) {
      console.error('Erro:', error)
      setError('Erro ao atualizar produto. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/parceiro/produtos" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/parceiro/produtos"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
            <p className="text-sm text-gray-500">Atualize as informações do seu produto</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none resize-none"
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
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Produto * (até 5)
              </label>
              <UploadMultiplasImagens 
                onUploadComplete={handleUploadComplete}
                currentImages={imageUrls}
                maxImages={5}
                produtoNome={formData.name || 'produto'}
              />
              <p className="text-xs text-gray-500 mt-2">
                Adicione até 5 imagens. A primeira será a principal.
              </p>
            </div>

            {/* Compatibilidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatível com tipos de mochila
              </label>
              <div className="flex flex-wrap gap-4">
                {mochilaTipos.map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mochila_tipo.includes(tipo)}
                      onChange={() => handleTipoChange(tipo)}
                      className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                    />
                    <span className="text-sm text-gray-700">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Link
                href="/parceiro/produtos"
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}