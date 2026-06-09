'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'

export default function NovoProduto() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validacoes basicas
    if (!formData.name || !formData.price || !formData.category) {
      setError('Preencha todos os campos obrigatorios')
      setLoading(false)
      return
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image_url: formData.image_url || '/images/produtos/placeholder.jpg',
      mochila_tipo: formData.mochila_tipo,
      is_active: true
    }

    const { error: insertError } = await supabase
      .from('products')
      .insert(productData)

    if (insertError) {
      console.error('Erro ao inserir produto:', insertError)
      setError('Erro ao criar produto. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/admin/produtos')
  }

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
          <h1 className="text-2xl font-bold text-black mb-6">Novo Produto</h1>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
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
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Ex: Mochila Tatica 30L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descricao
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Descricao detalhada do produto"
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
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                  placeholder="0.00"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Imagem
              </label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="/images/produtos/produto.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para usar imagem padrao
              </p>
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
                      checked={formData.mochila_tipo.includes(tipo)}
                      onChange={() => handleTipoChange(tipo)}
                      className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                    />
                    <span className="text-sm text-gray-700">{tipo}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecione para quais tipos de mochila este produto e recomendado
              </p>
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
                disabled={loading}
                className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}