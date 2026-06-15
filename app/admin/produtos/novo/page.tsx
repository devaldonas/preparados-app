'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import UploadMultiplasImagens from '@/components/UploadMultiplasImagens'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image_url: string
  images: string[]
  stock: number
  mochila_tipo: string[]
  is_active: boolean
}

export default function EditarProduto() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

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
    carregarProduto()
  }, [productId])

  const carregarProduto = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      console.error('Erro ao carregar produto:', error)
      router.push('/admin/produtos')
    } else {
      setProduct(data)
      // Carregar as imagens
      if (data.images && data.images.length > 0) {
        setImageUrls(data.images)
      } else if (data.image_url) {
        setImageUrls([data.image_url])
      } else {
        setImageUrls([])
      }
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProduct(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleTipoChange = (tipo: string) => {
    setProduct(prev => {
      if (!prev) return null
      const currentTipos = prev.mochila_tipo || []
      return {
        ...prev,
        mochila_tipo: currentTipos.includes(tipo)
          ? currentTipos.filter(t => t !== tipo)
          : [...currentTipos, tipo]
      }
    })
  }

  const handleImagesUploadComplete = (urls: string[]) => {
    setImageUrls(urls)
    setProduct(prev => prev ? { ...prev, images: urls, image_url: urls[0] } : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setSaving(true)
    setError('')
    setSuccess('')

    const updateData = {
      name: product.name,
      description: product.description,
      price: parseFloat(String(product.price)),
      category: product.category,
      image_url: imageUrls[0],
      images: imageUrls,
      stock: parseInt(String(product.stock)) || 0,
      mochila_tipo: product.mochila_tipo,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id)

    if (updateError) {
      console.error('Erro ao atualizar produto:', updateError)
      setError('Erro ao salvar alteracoes. Tente novamente.')
    } else {
      setSuccess('Produto atualizado com sucesso!')
      setTimeout(() => {
        router.push('/admin/produtos')
      }, 1500)
    }
    setSaving(false)
  }

  const toggleStatus = async () => {
    if (!product) return

    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (!updateError) {
      setProduct(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
      setSuccess(`Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/admin/produtos" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        <div className="mb-6">
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span> Voltar
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black">Editar Produto</h1>
            <button
              onClick={toggleStatus}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                product.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {product.is_active ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descricao
              </label>
              <textarea
                name="description"
                value={product.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preco (R$) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque
                </label>
                <input
                  type="number"
                  name="stock"
                  value={product.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Produto (ate 5)
              </label>
              <UploadMultiplasImagens 
                onUploadComplete={handleImagesUploadComplete}
                currentImages={imageUrls}
                maxImages={5}
                produtoNome={product.name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compativel com tipos de mochila
              </label>
              <div className="flex gap-4">
                {mochilaTipos.map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(product.mochila_tipo || []).includes(tipo)}
                      onChange={() => handleTipoChange(tipo)}
                      className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                    />
                    <span className="text-sm text-gray-700">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin/produtos')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alteracoes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}