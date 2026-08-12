'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react'

interface Product {
  id: number
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
  created_at: string
  updated_at: string
}

export default function ProdutoDetalhes({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    image_url: '',
    images: [] as string[],
    mochila_tipo: [] as string[],
    is_active: true,
    is_digital: false,
    free_shipping: false,
    file_url: '',
  })

  useEffect(() => {
    carregarProduto()
  }, [])

  const carregarProduto = async () => {
    try {
      // 🔥 CORRIGIDO: usando as any para evitar erro de tipo
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('id', parseInt(params.id))
        .single()

      if (error) throw error

      // 🔥 CORRIGIDO: usando as Product para garantir o tipo
      const productData = data as Product
      setProduct(productData)
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || 0,
        category: productData.category || '',
        stock: productData.stock || 0,
        image_url: productData.image_url || '',
        images: productData.images || [],
        mochila_tipo: productData.mochila_tipo || [],
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        is_digital: productData.is_digital || false,
        free_shipping: productData.free_shipping || false,
        file_url: productData.file_url || '',
      })

      // 🔥 CORRIGIDO: verificando images com segurança
      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        setSelectedImage(0)
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      alert('Erro ao carregar produto')
      router.push('/admin/produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
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
          images: formData.images,
          mochila_tipo: formData.mochila_tipo,
          is_active: formData.is_active,
          is_digital: formData.is_digital,
          free_shipping: formData.free_shipping,
          file_url: formData.file_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(params.id))

      if (error) throw error

      alert('Produto atualizado com sucesso!')
      setEditing(false)
      await carregarProduto()
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      const { error } = await (supabase
        .from('products') as any)
        .delete()
        .eq('id', parseInt(params.id))

      if (error) throw error

      alert('Produto deletado com sucesso!')
      router.push('/admin/produtos')
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      alert('Erro ao deletar produto')
    }
  }

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
        <div className="text-center">
          <p className="text-gray-500">Produto não encontrado</p>
          <Link href="/admin/produtos" className="text-[#FFB800] hover:underline mt-2 block">
            Voltar
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-black">Detalhes do Produto</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {editing ? (
            // Modo de edição
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                >
                  <option value="">Selecione</option>
                  <option value="mochilas">Mochilas</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="equipamentos">Equipamentos</option>
                  <option value="e-books">E-books</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                {['EDC', 'BOB', 'BOLT'].map((tipo) => (
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

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckbox}
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_digital"
                    checked={formData.is_digital}
                    onChange={handleCheckbox}
                  />
                  <span className="text-sm text-gray-700">Digital</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="free_shipping"
                    checked={formData.free_shipping}
                    onChange={handleCheckbox}
                  />
                  <span className="text-sm text-gray-700">Frete grátis</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
                >
                  <Save size={18} className="inline mr-2" />
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    carregarProduto()
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  <X size={18} className="inline mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            // Modo de visualização
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-black">{product.name}</h2>
                  <p className="text-gray-500 text-sm">ID: #{product.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">{product.description || 'Sem descrição'}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Preço</p>
                    <p className="font-semibold text-lg text-black">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estoque</p>
                    <p className={`font-semibold text-lg ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock < 5 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {product.stock} unidades
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-medium">{product.category || 'Não definida'}</p>
                </div>

                {product.mochila_tipo && product.mochila_tipo.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Tipos de Mochila</p>
                    <div className="flex gap-2 mt-1">
                      {product.mochila_tipo.map((tipo) => (
                        <span key={tipo} className="px-3 py-1 bg-[#FFB800]/10 text-[#FFB800] rounded-full text-sm">
                          {tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  {product.is_digital && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Digital</span>
                  )}
                  {product.free_shipping && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Frete Grátis</span>
                  )}
                </div>

                {product.image_url && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Imagem</p>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-100"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}