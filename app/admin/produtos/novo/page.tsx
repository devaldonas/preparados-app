'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadMultiplasImagens from '@/components/UploadMultiplasImagens'

export default function NovoProduto() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    mochila_tipo: [] as string[],
    is_digital: false,
    free_shipping: false,
    file_url: ''
  })

  const categories = [
    'Mochilas',
    'Acessorios',
    'Alimentacao',
    'Primeiros Socorros',
    'Ferramentas',
    'Tecnologia',
    'E-books'
  ]

  const mochilaTipos = ['EDC', 'BOB', 'BOLT']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => {
      const newState = { ...prev, [name]: checked }
      
      // Se for produto digital, free_shipping automaticamente true
      if (name === 'is_digital' && checked) {
        newState.free_shipping = true
        newState.stock = ''  // Limpa o estoque
      }
      
      return newState
    })
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
    setLoading(true)
    setError('')

    if (!formData.name || !formData.price || !formData.category) {
      setError('Preencha todos os campos obrigatorios')
      setLoading(false)
      return
    }

    if (imageUrls.length === 0) {
      setError('Adicione pelo menos uma imagem do produto')
      setLoading(false)
      return
    }

    // 🔥 Para produtos digitais, estoque fica como 9999 (ilimitado)
    const stock = formData.is_digital ? 9999 : (parseInt(formData.stock) || 0)

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: stock,
      image_url: imageUrls[0],
      images: imageUrls,
      mochila_tipo: formData.mochila_tipo,
      is_active: true,
      is_digital: formData.is_digital,
      free_shipping: formData.is_digital ? true : formData.free_shipping,
      file_url: formData.file_url || null
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
      <div className="max-w-2xl mx-auto px-4 py-8">

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

              {/* 🔥 CAMPO ESTOQUE - OCULTO PARA PRODUTOS DIGITAIS */}
              {!formData.is_digital && (
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
              )}
            </div>

            {/* 🔥 MENSAGEM PARA PRODUTO DIGITAL */}
            {formData.is_digital && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                Produto digital nao possui estoque fisico. O estoque sera definido como ilimitado.
              </div>
            )}

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

            {/* 🔥 CAMPOS DE PRODUTO DIGITAL */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Configuracoes de Entrega</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_digital"
                    name="is_digital"
                    checked={formData.is_digital}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 accent-[#FFB800] rounded"
                  />
                  <label htmlFor="is_digital" className="text-sm text-gray-700">
                    Produto Digital (e-book, curso, etc.)
                  </label>
                </div>

                {formData.is_digital && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do arquivo para download
                    </label>
                    <input
                      type="url"
                      name="file_url"
                      value={formData.file_url}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                      placeholder="https://seu-storage.com/arquivo.pdf"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Link para o arquivo que o cliente ira baixar apos a compra
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="free_shipping"
                    name="free_shipping"
                    checked={formData.is_digital ? true : formData.free_shipping}
                    onChange={handleCheckboxChange}
                    disabled={formData.is_digital}
                    className="w-4 h-4 accent-[#FFB800] rounded disabled:opacity-50"
                  />
                  <label htmlFor="free_shipping" className={`text-sm ${formData.is_digital ? 'text-gray-400' : 'text-gray-700'}`}>
                    {formData.is_digital ? 'Frete gratuito (produto digital)' : 'Frete Gratis'}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Produto * (ate 5)
              </label>
              <UploadMultiplasImagens 
                onUploadComplete={handleUploadComplete}
                currentImages={imageUrls}
                maxImages={5}
                produtoNome={formData.name}
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
                      checked={formData.mochila_tipo.includes(tipo)}
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
                disabled={loading}
                className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mb-6">
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span> Voltar
          </Link>
        </div>

      </div>
    </div>
  )
}